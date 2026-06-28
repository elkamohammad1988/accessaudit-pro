import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { effectivePlan, formatLimit, limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthIso } from "@/lib/dates";
import { annualPricingConfigured } from "@/lib/stripe-plan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { PlanGrid } from "@/components/settings/plan-grid";
import { openPortal } from "./actions";

export const metadata: Metadata = { title: "Billing" };

/** Human labels for the raw Stripe subscription statuses we never want to show. */
const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
};
const statusLabel = (status: string | null | undefined): string =>
  status ? (STATUS_LABEL[status] ?? status) : "No active subscription";

type BannerTone = "success" | "warning" | "error" | "info";

const STATUS_BANNER: Record<string, { text: string; tone: BannerTone }> = {
  success: {
    text: "Subscription updated. It can take a few seconds to reflect here.",
    tone: "success",
  },
  cancel: {
    text: "Checkout canceled — no changes were made.",
    tone: "warning",
  },
  error: {
    text: "Something went wrong with billing. Please try again.",
    tone: "error",
  },
  "no-customer": {
    text: "No billing account yet — pick a plan to get started.",
    tone: "warning",
  },
  "scan-limit": {
    text: "You've reached your plan's scan limit for this month. Upgrade to run more.",
    tone: "warning",
  },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [{ data: sub }, { count: scansThisMonth }, { count: clientsCount }, { count: projectsCount }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, stripe_subscription_id")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .gte("created_at", startOfMonthIso()),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .is("archived_at", null),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .is("archived_at", null),
    ]);

  // The subscription names a tier; `effectivePlan` is what's actually enforced
  // (an unpaid/canceled sub reverts to free limits). Show the real tier in the
  // header/plan grid, but size the usage meters by the enforced limits.
  const actualPlan: PlanTier = sub?.plan ?? "free";
  const plan = effectivePlan(sub?.plan, sub?.status);
  const actualLimits = limitsFor(actualPlan);
  const limits = limitsFor(plan);
  const hasPaid = actualPlan !== "free" && Boolean(sub?.stripe_subscription_id);
  const downgraded = plan !== actualPlan;
  const banner = status ? STATUS_BANNER[status] : undefined;

  const usage = [
    { label: "Scans this month", used: scansThisMonth ?? 0, limit: limits.scansPerMonth },
    { label: "Clients", used: clientsCount ?? 0, limit: limits.clients },
    { label: "Projects", used: projectsCount ?? 0, limit: limits.projects },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Settings
        </Link>
        <header className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <Badge variant={hasPaid ? "default" : "secondary"}>{actualLimits.label} plan</Badge>
        </header>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasPaid ? statusLabel(sub?.status) : "No active subscription"}
          {hasPaid && sub?.current_period_end
            ? ` · renews ${new Date(sub.current_period_end).toLocaleDateString()}`
            : ""}
        </p>
      </div>

      {downgraded ? (
        <NoticeBanner tone="warning">
          Your {actualLimits.label} subscription is {statusLabel(sub?.status).toLowerCase()}, so{" "}
          {limits.label}-plan limits currently apply. Update your payment method in the billing
          portal to restore full access.
        </NoticeBanner>
      ) : null}

      {banner ? <NoticeBanner tone={banner.tone}>{banner.text}</NoticeBanner> : null}

      <section aria-label="Usage" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {usage.map((u) => {
          const overEighty = Number.isFinite(u.limit) && u.limit > 0 && u.used / u.limit >= 0.8;
          return (
            <Card key={u.label} className="p-5">
              <p className="text-sm text-muted-foreground">{u.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {u.used}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {formatLimit(u.limit)}
                </span>
              </p>
              <Progress
                className="mt-3"
                value={u.used}
                max={u.limit}
                tone={overEighty ? "warning" : "brand"}
                label={`${u.label} usage`}
              />
            </Card>
          );
        })}
      </section>

      {hasPaid ? (
        <Card>
          <section aria-label="Manage subscription" className="p-6">
            <h2 className="text-lg font-medium">Manage subscription</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Change plan, update payment method, view invoices, or cancel.
            </p>
            <form action={openPortal} className="mt-4">
              <Button type="submit">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Open billing portal
              </Button>
            </form>
          </section>
        </Card>
      ) : null}

      <PlanGrid
        actualPlan={actualPlan}
        hasPaid={hasPaid}
        annualAvailable={annualPricingConfigured()}
      />
    </div>
  );
}
