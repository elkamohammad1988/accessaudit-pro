import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus, Users, FolderKanban, ScanLine } from "lucide-react";
import {
  effectivePlan,
  limitsFor,
  scoreBand,
  sumTotals,
  type PlanTier,
  type ScanStatus,
} from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthIso, formatDateTime } from "@/lib/dates";
import { parseTotals, scoreClassName } from "@/lib/scan-format";
import { cn } from "@/lib/utils";
import { getTranslations, getLocale } from "@/i18n/server";
import { bandLabel, displayLimit } from "@/i18n/format";
import type { Translator } from "@/i18n/translate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/tilt-card";
import { Magnetic } from "@/components/ui/magnetic";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { Progress } from "@/components/ui/progress";
import { CountUp } from "@/components/ui/count-up";
import { Sparkline } from "@/components/charts/sparkline";
import { ScoreGauge } from "@/components/charts/score-gauge";
import { SeverityBar } from "@/components/dashboard/severity-bar";
import { ScanStatusBadge } from "@/components/scans/scan-status-badge";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("metaTitle") };
}

export default async function DashboardPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const t = await getTranslations("dashboard");
  const tb = await getTranslations("common.band");
  const ts = await getTranslations("common.score");
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
    // Oldest→newest completed scans for the trend + severity rollup.
    supabase
      .from("scans")
      .select("score, totals, created_at")
      .eq("organization_id", organization.id)
      .eq("status", "completed")
      .order("created_at", { ascending: true })
      .limit(30),
  ]);

  const plan: PlanTier = effectivePlan(subscription?.plan, subscription?.status);
  const limits = limitsFor(plan);
  const scansUsed = scansThisMonth ?? 0;
  const clients = clientsCount ?? 0;
  const projects = projectsCount ?? 0;

  const trend = (completedScans ?? [])
    .map((s) => s.score)
    .filter((s): s is number => typeof s === "number");
  const avgScore =
    trend.length > 0 ? Math.round((trend.reduce((a, b) => a + b, 0) / trend.length) * 10) / 10 : null;
  const band = scoreBand(avgScore);
  const aggregateTotals = sumTotals((completedScans ?? []).map((s) => parseTotals(s.totals)));

  const meterTone = (used: number, max: number) =>
    Number.isFinite(max) && used / max >= 0.8 ? "warning" : "brand";

  // Drives the live activity indicator on the Recent heading: true while any
  // listed scan is still queued or running (i.e. work is happening right now).
  const hasLiveScans = (recentScans ?? []).some(
    (s) => s.status === "queued" || s.status === "running",
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {organization.name}
            <Badge variant="secondary">{t("planBadge", { plan: limits.label })}</Badge>
          </p>
        </div>
        <Magnetic>
          <ButtonLink href="/scans/new" size="lg">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newScan")}
          </ButtonLink>
        </Magnetic>
      </header>

      {/* Score trend hero + usage meters. The hero is a live 3D glass panel: it
          tilts toward the cursor and catches a specular sheen (the outer wrapper
          owns the entrance animation so its transform never fights the tilt). */}
      <section className="grid gap-3 lg:grid-cols-3">
        <div className="animate-rise-in lg:col-span-2">
          <TiltCard className="h-full overflow-hidden">
            <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("avgScore")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="relative">
                {/* A faint, still brass burnish behind the score — the seal cue.
                    Dark-mode only, no pulse (the breathing glow was the glass tell). */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden rounded-full bg-gold/[0.10] blur-2xl dark:block"
                />
                <ScoreGauge
                  score={avgScore}
                  ariaLabel={avgScore != null ? ts("aria", { score: avgScore }) : ts("none")}
                />
              </div>
              {avgScore != null && (
                <Badge variant={band.tone === "muted" ? "secondary" : band.tone}>
                  {bandLabel(band.tone, tb)}
                </Badge>
              )}
            </div>
            <div className="w-full min-w-0 flex-1">
              {trend.length >= 2 ? (
                <Sparkline data={trend} label={t("scoreTrendLabel", { count: trend.length })} />
              ) : (
                <div className="flex h-16 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  {t("trendEmpty")}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {t.plural("trendCaption", trend.length)}
              </p>
            </div>
          </CardContent>
        </TiltCard>
        </div>

        <Card className="animate-rise-in [animation-delay:90ms]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("usageTitle")}</CardTitle>
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
      </section>

      {/* Quick stats — small accent cards drift on a gentle, staggered float in
          dark mode (the float classes are no-ops in light mode and under
          reduced-motion). */}
      <section className="grid gap-3 sm:grid-cols-3 animate-rise-in [animation-delay:140ms]">
        <QuickStat
          href="/clients"
          icon={Users}
          label={t("meters.clients")}
          value={clients}
          maxLabel={displayLimit(limits.clients, tp)}
          locale={locale}
          className="lux-float-1"
        />
        <QuickStat
          href="/projects"
          icon={FolderKanban}
          label={t("meters.projects")}
          value={projects}
          maxLabel={displayLimit(limits.projects, tp)}
          locale={locale}
          className="lux-float-2"
        />
        <Card className="lux-float-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("pagesPerScan")}</p>
              <IconChip icon={ScanLine} tone="gold" size="sm" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{displayLimit(limits.pagesPerScan, tp)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Severity distribution */}
      {completedScans && completedScans.length > 0 && (
        <Card className="animate-rise-in [animation-delay:200ms]">
          <CardHeader>
            <CardTitle className="text-base">{t("severityHeading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityBar totals={aggregateTotals} />
          </CardContent>
        </Card>
      )}

      {/* Recent scans */}
      <section className="space-y-3 animate-rise-in [animation-delay:260ms]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2.5 text-lg font-medium">
            {t("recentHeading")}
            {/* Live activity indicator — breathing emerald dot shown only while a
                listed scan is actively queued or running. Decorative: the scan
                badges below already convey status to assistive tech. */}
            {hasLiveScans ? <span className="live-dot" aria-hidden="true" /> : null}
          </h2>
        </div>
        {recentScans && recentScans.length > 0 ? (
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {recentScans.map((scan) => {
                return (
                  <li key={scan.id}>
                    <Link
                      href={`/scans/${scan.id}`}
                      className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <ScanStatusBadge status={scan.status as ScanStatus} />
                        <div>
                          <p className="text-sm font-medium">
                            {t.plural("pagesCount", scan.pages_scanned)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(scan.created_at, locale)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold tabular-nums ${scoreClassName(scan.score)}`}>
                          {scan.score != null ? `${scan.score}/100` : "—"}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
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
        )}
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

function QuickStat({
  href,
  icon: Icon,
  label,
  value,
  maxLabel,
  locale,
  className,
}: {
  href: "/clients" | "/projects";
  icon: typeof Users;
  label: string;
  value: number;
  maxLabel: string;
  locale: string;
  className?: string;
}) {
  return (
    <Card interactive className={cn("group overflow-hidden", className)}>
      <Link href={href} className="block p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <IconChip
            icon={Icon}
            tone="brand"
            size="sm"
            className="transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
          />
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          <CountUp value={value} locale={locale} />
          <span className="text-base font-normal text-muted-foreground"> / {maxLabel}</span>
        </p>
      </Link>
    </Card>
  );
}
