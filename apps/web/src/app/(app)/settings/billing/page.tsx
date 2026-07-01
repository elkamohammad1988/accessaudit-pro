import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { effectivePlan, limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthIso } from "@/lib/dates";
import { annualPricingConfigured } from "@/lib/stripe-plan";
import { getTranslations, getLocale } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { PlanGrid } from "@/components/settings/plan-grid";
import { openPortal } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return { title: t("metaTitle") };
}

type BannerTone = "success" | "warning" | "error" | "info";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { organization } = await requireSession();
  if (!organization) return null;

  const t = await getTranslations("billing");
  const tp = await getTranslations("plans");
  const locale = await getLocale();

  // Human labels for the raw Stripe subscription statuses we never want to show.
  const STATUS_LABEL: Record<string, string> = {
    active: t("status.active"),
    trialing: t("status.trialing"),
    past_due: t("status.pastDue"),
    canceled: t("status.canceled"),
    incomplete: t("status.incomplete"),
  };
  const statusLabel = (s: string | null | undefined): string =>
    s ? (STATUS_LABEL[s] ?? s) : t("status.none");

  const STATUS_BANNER: Record<string, { text: string; tone: BannerTone }> = {
    success: { text: t("banner.success"), tone: "success" },
    cancel: { text: t("banner.cancel"), tone: "warning" },
    error: { text: t("banner.error"), tone: "error" },
    "no-customer": { text: t("banner.noCustomer"), tone: "warning" },
    "scan-limit": { text: t("banner.scanLimit"), tone: "warning" },
  };

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
    { label: t("usage.scansThisMonth"), used: scansThisMonth ?? 0, limit: limits.scansPerMonth },
    { label: t("usage.clients"), used: clientsCount ?? 0, limit: limits.clients },
    { label: t("usage.projects"), used: projectsCount ?? 0, limit: limits.projects },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("backToSettings")}
        </Link>
        <header className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <Badge variant={hasPaid ? "default" : "secondary"}>
            {t("planBadge", { plan: actualLimits.label })}
          </Badge>
        </header>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasPaid ? statusLabel(sub?.status) : t("status.none")}
          {hasPaid && sub?.current_period_end
            ? ` · ${t("renewsOn", { date: new Date(sub.current_period_end).toLocaleDateString(locale) })}`
            : ""}
        </p>
      </div>

      {downgraded ? (
        <NoticeBanner tone="warning">
          {t("downgradeNotice", {
            plan: actualLimits.label,
            status: statusLabel(sub?.status).toLowerCase(),
            effectivePlan: limits.label,
          })}
        </NoticeBanner>
      ) : null}

      {banner ? <NoticeBanner tone={banner.tone}>{banner.text}</NoticeBanner> : null}

      <section aria-label={t("usage.aria")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {usage.map((u) => {
          const overEighty = Number.isFinite(u.limit) && u.limit > 0 && u.used / u.limit >= 0.8;
          return (
            <Card key={u.label} className="p-5">
              <p className="text-sm text-muted-foreground">{u.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {u.used}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {displayLimit(u.limit, tp)}
                </span>
              </p>
              <Progress
                className="mt-3"
                value={u.used}
                max={u.limit}
                tone={overEighty ? "warning" : "brand"}
                label={t("usage.meter", { label: u.label })}
              />
            </Card>
          );
        })}
      </section>

      {hasPaid ? (
        <Card>
          <section aria-label={t("manage.aria")} className="p-5">
            <h2 className="text-lg font-medium">{t("manage.heading")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("manage.description")}</p>
            <form action={openPortal} className="mt-4">
              <Button type="submit">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {t("manage.openPortal")}
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
