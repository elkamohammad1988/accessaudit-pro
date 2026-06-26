import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  effectivePlan,
  formatLimit,
  limitsFor,
  type PlanTier,
} from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthIso } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { startCheckout, openPortal } from "./actions";

export const metadata: Metadata = { title: "Billing" };

const STATUS_BANNER: Record<string, { text: string; className: string }> = {
  success: {
    text: "Subscription updated. It can take a few seconds to reflect here.",
    className: "border-success/30 bg-success/10 text-success",
  },
  cancel: {
    text: "Checkout canceled — no changes were made.",
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  error: {
    text: "Something went wrong with billing. Please try again.",
    className: "border-danger/30 bg-danger/10 text-danger",
  },
  "no-customer": {
    text: "No billing account yet — pick a plan to get started.",
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  "scan-limit": {
    text: "You've reached your plan's scan limit for this month. Upgrade to run more.",
    className: "border-warning/30 bg-warning/10 text-warning",
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
          {hasPaid && sub?.status ? `${sub.status}` : "No active subscription"}
          {hasPaid && sub?.current_period_end
            ? ` · renews ${new Date(sub.current_period_end).toLocaleDateString()}`
            : ""}
        </p>
      </div>

      {downgraded ? (
        <p
          role="status"
          className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning"
        >
          Your {actualLimits.label} subscription is {sub?.status ?? "inactive"}, so{" "}
          {limits.label}-plan limits currently apply. Update your payment method in the billing
          portal to restore full access.
        </p>
      ) : null}

      {banner ? (
        <p role="status" className={`rounded-lg border p-3 text-sm ${banner.className}`}>
          {banner.text}
        </p>
      ) : null}

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

      <section aria-label="Plans" className="space-y-3">
        <h2 className="text-lg font-medium">Plans</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => {
            const p = PLAN_LIMITS[tier];
            const isCurrent = tier === actualPlan;
            return (
              <Card
                key={tier}
                className={`flex flex-col p-5 ${isCurrent ? "border-brand ring-1 ring-brand" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{p.label}</p>
                  {isCurrent ? <Badge>Current</Badge> : null}
                </div>
                <p className="mt-1 text-2xl font-bold tracking-tight">
                  ${p.priceMonthly}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1 text-sm text-muted-foreground">
                  <li>{formatLimit(p.clients)} clients</li>
                  <li>{formatLimit(p.projects)} projects</li>
                  <li>{formatLimit(p.scansPerMonth)} scans/mo</li>
                  <li>{formatLimit(p.pagesPerScan)} pages/scan</li>
                  <li>{p.whiteLabelPdf ? "White-label PDF" : "No white-label"}</li>
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <span className="text-xs text-muted-foreground">Your plan</span>
                  ) : tier === "free" ? (
                    hasPaid ? (
                      <span className="text-xs text-muted-foreground">Downgrade via portal</span>
                    ) : null
                  ) : hasPaid ? (
                    <span className="text-xs text-muted-foreground">Switch via portal</span>
                  ) : (
                    <form action={startCheckout}>
                      <input type="hidden" name="plan" value={tier} />
                      <Button type="submit" size="sm" className="w-full">
                        Choose {p.label}
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Limits are enforced as you create clients, projects, and scans. Prices billed monthly via
          Stripe. Workspaces are single-user in this release — team seats are on the roadmap.
        </p>
      </section>
    </div>
  );
}
