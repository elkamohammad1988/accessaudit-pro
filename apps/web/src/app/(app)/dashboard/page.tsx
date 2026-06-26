import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus, Users, FolderKanban } from "lucide-react";
import {
  effectivePlan,
  formatLimit,
  limitsFor,
  scoreBand,
  sumTotals,
  type PlanTier,
} from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthIso, formatDateTime } from "@/lib/dates";
import { parseTotals, scoreClassName } from "@/lib/scan-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/charts/sparkline";
import { ScoreGauge } from "@/components/charts/score-gauge";
import { SeverityBar } from "@/components/dashboard/severity-bar";
import { ScanStatusBadge } from "@/components/scans/scan-status-badge";
import { ScanLine } from "lucide-react";
import type { ScanStatus } from "@accessaudit/shared";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();

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

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {organization.name}
            <Badge variant="secondary">{limits.label} plan</Badge>
          </p>
        </div>
        <ButtonLink href="/scans/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New scan
        </ButtonLink>
      </header>

      {/* Score trend hero + usage meters */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average accessibility score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative flex shrink-0 flex-col items-center gap-2">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-12 h-28 w-28 -translate-x-1/2 rounded-full bg-brand/10 blur-2xl"
              />
              <ScoreGauge score={avgScore} />
              {avgScore != null && (
                <Badge variant={band.tone === "muted" ? "secondary" : band.tone}>{band.label}</Badge>
              )}
            </div>
            <div className="w-full min-w-0 flex-1">
              {trend.length >= 2 ? (
                <Sparkline data={trend} label={`Score trend across ${trend.length} scans`} />
              ) : (
                <div className="flex h-16 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  Run a few scans to see your score trend here.
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Across your last {trend.length} completed scan{trend.length === 1 ? "" : "s"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Usage this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Meter
              label="Scans"
              used={scansUsed}
              max={limits.scansPerMonth}
              tone={meterTone(scansUsed, limits.scansPerMonth)}
            />
            <Meter label="Clients" used={clients} max={limits.clients} tone={meterTone(clients, limits.clients)} />
            <Meter
              label="Projects"
              used={projects}
              max={limits.projects}
              tone={meterTone(projects, limits.projects)}
            />
          </CardContent>
        </Card>
      </section>

      {/* Quick stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <QuickStat href="/clients" icon={Users} label="Clients" value={clients} max={limits.clients} />
        <QuickStat href="/projects" icon={FolderKanban} label="Projects" value={projects} max={limits.projects} />
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pages / scan</p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-inset ring-border">
                <ScanLine className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{formatLimit(limits.pagesPerScan)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Severity distribution */}
      {completedScans && completedScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issues by severity</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityBar totals={aggregateTotals} />
          </CardContent>
        </Card>
      )}

      {/* Recent scans */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent scans</h2>
        </div>
        {recentScans && recentScans.length > 0 ? (
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {recentScans.map((scan) => {
                return (
                  <li key={scan.id}>
                    <Link
                      href={`/scans/${scan.id}`}
                      className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <ScanStatusBadge status={scan.status as ScanStatus} />
                        <div>
                          <p className="text-sm font-medium">
                            {scan.pages_scanned} page{scan.pages_scanned === 1 ? "" : "s"}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(scan.created_at)}</p>
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
            title="No scans yet"
            description="Run your first accessibility audit to see your scores, trends, and issues here."
            action={
              <ButtonLink href="/scans/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Run your first scan
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
  used,
  max,
  tone,
}: {
  label: string;
  used: number;
  max: number;
  tone: "brand" | "warning";
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used} <span className="text-muted-foreground">/ {formatLimit(max)}</span>
        </span>
      </div>
      <Progress value={used} max={max} tone={tone} label={`${label} usage`} />
    </div>
  );
}

function QuickStat({
  href,
  icon: Icon,
  label,
  value,
  max,
}: {
  href: "/clients" | "/projects";
  icon: typeof Users;
  label: string;
  value: number;
  max: number;
}) {
  return (
    <Card interactive className="group overflow-hidden">
      <Link href={href} className="block p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/15 transition-colors group-hover:bg-brand/15">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {value}
          <span className="text-base font-normal text-muted-foreground"> / {formatLimit(max)}</span>
        </p>
      </Link>
    </Card>
  );
}
