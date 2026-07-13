import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  FolderKanban,
  Gauge,
  Plus,
  ScanLine,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  effectivePlan,
  IMPACT_LEVELS,
  limitsFor,
  scoreBand,
  sumTotals,
  type ImpactLevel,
  type PlanTier,
  type ScanStatus,
} from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthIso, formatDateTime } from "@/lib/dates";
import { parseTotals, scoreClassName, totalViolations } from "@/lib/scan-format";
import { getTranslations, getLocale } from "@/i18n/server";
import { bandLabel, displayLimit } from "@/i18n/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { CountUp } from "@/components/ui/count-up";
import { AreaChart } from "@/components/charts/area-chart";
import { Donut } from "@/components/charts/donut";
import { GradientStatCard } from "@/components/dashboard/stat-card";
import { ScanStatusBadge } from "@/components/scans/scan-status-badge";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("metaTitle") };
}

/** CSS custom property per impact level, for the severity donut + legend. */
const SEV_VAR: Record<ImpactLevel, string> = {
  critical: "--sev-critical",
  serious: "--sev-serious",
  moderate: "--sev-moderate",
  minor: "--sev-minor",
};
const SEV_DOT: Record<ImpactLevel, string> = {
  critical: "bg-critical",
  serious: "bg-serious",
  moderate: "bg-moderate",
  minor: "bg-minor",
};

export default async function DashboardPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const t = await getTranslations("dashboard");
  const tb = await getTranslations("common.band");
  const ts = await getTranslations("scans");
  const tp = await getTranslations("plans");
  const locale = await getLocale();

  const [
    { data: subscription },
    { count: scansThisMonth },
    { count: clientsCount },
    { count: projectsCount },
    { data: recentScans },
    { data: completedScans },
  ] = await Promise.all([
    supabase.from("subscriptions").select("plan, status").eq("organization_id", organization.id).maybeSingle(),
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
    supabase
      .from("scans")
      .select("id, status, score, created_at, pages_scanned")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(6),
    // Most recent 30 completed scans for the trend + severity rollup. Ordered
    // DESC + limit so we keep the LATEST 30 (ascending + limit would freeze the
    // dashboard on the oldest 30 forever); reversed to oldest→newest below so the
    // trend chart still reads left-to-right in chronological order.
    supabase
      .from("scans")
      .select("score, totals, created_at")
      .eq("organization_id", organization.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  // Reverse the DESC fetch back to chronological order for the trend line/delta.
  const completed = (completedScans ?? []).slice().reverse();

  const plan: PlanTier = effectivePlan(subscription?.plan, subscription?.status);
  const limits = limitsFor(plan);
  const scansUsed = scansThisMonth ?? 0;
  const clients = clientsCount ?? 0;
  const projects = projectsCount ?? 0;

  const trend = completed
    .map((s) => s.score)
    .filter((s): s is number => typeof s === "number");
  const avgScore =
    trend.length > 0 ? Math.round((trend.reduce((a, b) => a + b, 0) / trend.length) * 10) / 10 : null;
  const band = scoreBand(avgScore);
  const delta =
    trend.length >= 2 ? Math.round((trend[trend.length - 1] - trend[0]) * 10) / 10 : null;

  const aggregateTotals = sumTotals(completed.map((s) => parseTotals(s.totals)));
  const totalIssues = totalViolations(aggregateTotals);
  const severitySegments = IMPACT_LEVELS.map((level) => ({
    value: aggregateTotals[level],
    colorVar: SEV_VAR[level],
    label: ts(`impact.${level}`),
  }));
  const distributionLabel = IMPACT_LEVELS.filter((l) => aggregateTotals[l] > 0)
    .map((l) => `${aggregateTotals[l]} ${ts(`impact.${l}`).toLowerCase()}`)
    .join(", ");

  const meterTone = (used: number, max: number) =>
    Number.isFinite(max) && used / max >= 0.8 ? "warning" : "brand";

  // Drives the live activity indicator on the Recent heading.
  const hasLiveScans = (recentScans ?? []).some(
    (s) => s.status === "queued" || s.status === "running",
  );

  return (
    <div className="space-y-5">
      {/* Content header */}
      <PageHeader
        title={t("title")}
        subtitle={
          <>
            {organization.name}
            <Badge variant="secondary">{t("planBadge", { plan: limits.label })}</Badge>
          </>
        }
        actions={
          <ButtonLink href="/scans/new" size="lg">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newScan")}
          </ButtonLink>
        }
      />

      {/* Row 1 — colorful gradient metric cards (the Jumbo signature) */}
      <section className="grid animate-rise-in gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard
          label={t("kpiAvgScore")}
          value={avgScore}
          unit="/ 100"
          caption={avgScore != null ? bandLabel(band.tone, tb) : undefined}
          icon={Gauge}
          gradient="gold"
          beaded
          locale={locale}
        />
        <GradientStatCard
          label={t("kpiScans")}
          value={scansUsed}
          caption={t("ofLimit", { limit: displayLimit(limits.scansPerMonth, tp) })}
          icon={ScanLine}
          gradient="terracotta"
          locale={locale}
        />
        <GradientStatCard
          label={t("meters.clients")}
          value={clients}
          caption={t("ofLimit", { limit: displayLimit(limits.clients, tp) })}
          icon={Users}
          gradient="emerald"
          href="/clients"
          locale={locale}
        />
        <GradientStatCard
          label={t("meters.projects")}
          value={projects}
          caption={t("ofLimit", { limit: displayLimit(limits.projects, tp) })}
          icon={FolderKanban}
          gradient="rose"
          href="/projects"
          locale={locale}
        />
      </section>

      {/* Row 2 — trend + severity */}
      <section className="grid animate-rise-in gap-4 [animation-delay:90ms] lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle as="h2">{t("trendTitle")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.plural("trendSub", Math.max(trend.length, 0))}
              </p>
            </div>
            {delta != null ? (
              <Badge variant={delta >= 0 ? "success" : "danger"}>
                {delta >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {delta >= 0 ? "+" : ""}
                {delta} {t("trendVsFirst")}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            {trend.length >= 2 ? (
              <AreaChart data={trend} label={t("scoreTrendLabel", { count: trend.length })} height={200} />
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                {t("trendEmpty")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{t("severityHeading")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <Donut
              segments={severitySegments}
              ariaLabel={
                totalIssues > 0
                  ? ts("severityBar.distribution", { distribution: distributionLabel })
                  : ts("severityBar.none")
              }
            >
              <span className="text-3xl font-bold tabular-nums leading-none">
                <CountUp value={totalIssues} locale={locale} />
              </span>
              <span className="mt-1 text-xs text-muted-foreground">{t("donutTotal")}</span>
            </Donut>
            <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
              {IMPACT_LEVELS.map((level) => (
                <li key={level} className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${SEV_DOT[level]}`} aria-hidden="true" />
                  <span className="flex-1 truncate text-muted-foreground">{ts(`impact.${level}`)}</span>
                  <span className="font-semibold tabular-nums">{aggregateTotals[level]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Row 3 — usage + recent scans */}
      <section className="grid animate-rise-in gap-4 [animation-delay:160ms] lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t("usageTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Meter
              label={t("meters.scans")}
              ariaLabel={t("meters.aria", { label: t("meters.scans") })}
              used={scansUsed}
              max={limits.scansPerMonth}
              maxLabel={displayLimit(limits.scansPerMonth, tp)}
              tone={meterTone(scansUsed, limits.scansPerMonth)}
              locale={locale}
            />
            <Meter
              label={t("meters.clients")}
              ariaLabel={t("meters.aria", { label: t("meters.clients") })}
              used={clients}
              max={limits.clients}
              maxLabel={displayLimit(limits.clients, tp)}
              tone={meterTone(clients, limits.clients)}
              locale={locale}
            />
            <Meter
              label={t("meters.projects")}
              ariaLabel={t("meters.aria", { label: t("meters.projects") })}
              used={projects}
              max={limits.projects}
              maxLabel={displayLimit(limits.projects, tp)}
              tone={meterTone(projects, limits.projects)}
              locale={locale}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle as="h2" className="flex items-center gap-2.5">
              {t("recentHeading")}
              {hasLiveScans ? <span className="live-dot" aria-hidden="true" /> : null}
            </CardTitle>
          </CardHeader>
          {recentScans && recentScans.length > 0 ? (
            <div>
              {/* Column header — the Jumbo table rule, hidden on the stacked mobile view. */}
              <div className="hidden grid-cols-[8rem_1fr_10rem_auto] items-center gap-4 border-b px-6 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                <span>{t("table.status")}</span>
                <span>{t("table.pages")}</span>
                <span>{t("table.date")}</span>
                <span className="text-end">{t("table.score")}</span>
              </div>
              <ul className="divide-y">
                {recentScans.map((scan) => (
                  <li key={scan.id}>
                    <Link
                      href={`/scans/${scan.id}`}
                      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[8rem_1fr_10rem_auto]"
                    >
                      <ScanStatusBadge status={scan.status as ScanStatus} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {t.plural("pagesCount", scan.pages_scanned)}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {formatDateTime(scan.created_at, locale)}
                        </p>
                      </div>
                      <span className="hidden text-sm text-muted-foreground md:block">
                        {formatDateTime(scan.created_at, locale)}
                      </span>
                      <span className="flex items-center justify-end gap-2">
                        <span className={`text-sm font-semibold tabular-nums ${scoreClassName(scan.score)}`}>
                          {scan.score != null ? `${scan.score}/100` : "—"}
                        </span>
                        <ArrowUpRight
                          className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <CardContent>
              <EmptyState
                icon={ScanLine}
                title={t("emptyTitle")}
                description={t("emptyDescription")}
                action={
                  <ButtonLink href="/scans/new">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("emptyAction")}
                  </ButtonLink>
                }
              />
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  );
}

function Meter({
  label,
  ariaLabel,
  used,
  max,
  maxLabel,
  tone,
  locale,
}: {
  label: string;
  ariaLabel: string;
  used: number;
  max: number;
  maxLabel: string;
  tone: "brand" | "warning";
  locale: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          <CountUp value={used} locale={locale} /> <span className="text-muted-foreground">/ {maxLabel}</span>
        </span>
      </div>
      <Progress value={used} max={max} tone={tone} label={ariaLabel} />
    </div>
  );
}
