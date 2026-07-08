"use client";

import { ChevronDown } from "lucide-react";
import { IMPACT_LEVELS, scoreBand, type ImpactTotals, type ScanStatus } from "@accessaudit/shared";
import { IMPACT_BADGE, scoreClassName, totalViolations } from "@/lib/scan-format";
import { formatDateTime } from "@/lib/dates";
import { useTranslations, useLocale } from "@/i18n/provider";
import { bandLabel } from "@/i18n/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoreGauge } from "@/components/charts/score-gauge";
import type { GroupedViolation } from "@/lib/report";

/** Left-edge accent per impact level — lets a reader scan severity at a glance. */
const IMPACT_ACCENT: Record<string, string> = {
  critical: "border-s-critical",
  serious: "border-s-serious",
  moderate: "border-s-moderate",
  minor: "border-s-minor",
};

export interface ReportPage {
  url: string;
  status: string;
  httpStatus: number | null;
  score: number | null;
  totals: ImpactTotals;
}

export interface ReportViewProps {
  status: ScanStatus;
  score: number | null;
  totals: ImpactTotals;
  wcagLevel: string;
  pagesScanned: number;
  finishedAt: string | null;
  errorReason: string | null;
  pages: ReportPage[];
  groups: GroupedViolation[];
  /** Render every violation expanded (used by the print/PDF view). */
  expanded?: boolean;
  /** Total violation rows that exist (may exceed those rendered). */
  totalViolationRows?: number;
  /** True when more violations exist than were loaded for display. */
  truncated?: boolean;
}

/**
 * Max affected-element cards rendered per rule on screen, to keep the DOM (and
 * the public share link on low-end mobile) bounded on large scans. The print
 * view and CSV export are never capped. A rule with more shows a "+N more" hint.
 */
const MAX_NODES_PER_GROUP = 12;

function capOccurrences(
  group: GroupedViolation,
  max: number,
): { occurrences: GroupedViolation["occurrences"]; hidden: number } {
  if (group.nodeCount <= max) return { occurrences: group.occurrences, hidden: 0 };
  const occurrences: GroupedViolation["occurrences"] = [];
  let shown = 0;
  for (const occ of group.occurrences) {
    if (shown >= max) break;
    const nodes = occ.nodes.slice(0, Math.max(0, max - shown));
    occurrences.push({ pageUrl: occ.pageUrl, nodes });
    shown += Math.max(nodes.length, 1);
  }
  return { occurrences, hidden: Math.max(0, group.nodeCount - shown) };
}

export function ReportView({
  status,
  score,
  totals,
  wcagLevel,
  pagesScanned,
  finishedAt,
  errorReason,
  pages,
  groups,
  expanded = false,
  totalViolationRows,
  truncated = false,
}: ReportViewProps) {
  const t = useTranslations("scans");
  const tb = useTranslations("common.band");
  const ts = useTranslations("common.score");
  const locale = useLocale();
  const issues = totalViolations(totals);
  const inProgress = status === "queued" || status === "running";
  const failedPages = Math.max(0, pages.length - pagesScanned);
  const band = scoreBand(score);
  const criticalAndSerious = totals.critical + totals.serious;

  if (inProgress) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <div>
          <p className="flex items-center justify-center gap-2 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
            </span>
            {t("status." + status)}…
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {t("report.inProgressNote")}
          </p>
          <div
            role="progressbar"
            aria-label={t("report.inProgressAria")}
            className="mx-auto mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full w-1/3 rounded-full bg-brand animate-progress-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 p-5">
        <p className="font-medium text-danger-strong">{t("report.failedTitle")}</p>
        <p className="mt-1 text-sm text-danger-strong/90">{errorReason ?? t("report.unknownError")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {status === "partial" && failedPages > 0 ? (
        <section
          aria-label={t("report.partialAria")}
          className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm"
        >
          <p className="font-medium text-warning-strong">{t.plural("report.partialTitle", failedPages)}</p>
          <p className="mt-1 text-muted-foreground">{t.plural("report.partialBody", pagesScanned)}</p>
        </section>
      ) : null}

      {/* Summary — the report's headline verdict, composed as a certificate band:
          a focal score "seal" (a soft gold halo behind the gauge on screen) beside
          two engraved stat cards. Mono eyebrows carry the editorial voice used
          across the product; the numerals stay precise tabular Inter, because this
          is a data document, not a marketing surface. */}
      <section aria-label={t("report.summaryAria")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="relative flex flex-col items-center justify-center gap-3 overflow-hidden p-5 text-center">
          <div className="relative">
            {/* Faint brass burnish behind the score — the "seal" cue. Screen + dark
                only (gated off the print/PDF route via `!expanded`), static, no motion. */}
            {!expanded ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden rounded-full bg-gold/[0.10] blur-2xl dark:block"
              />
            ) : null}
            <ScoreGauge
              score={score}
              ariaLabel={score != null ? ts("aria", { score }) : ts("none")}
            />
          </div>
          <div className="space-y-1.5">
            <Badge variant={band.tone === "muted" ? "secondary" : band.tone}>{bandLabel(band.tone, tb)}</Badge>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("report.accessibilityScore")}
            </p>
          </div>
        </Card>
        <Card className="flex flex-col justify-center p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("report.issuesFound")}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{issues}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className={criticalAndSerious > 0 ? "font-semibold text-danger-strong" : undefined}>
              {criticalAndSerious}
            </span>{" "}
            {t("report.criticalOrSerious")}
          </p>
        </Card>
        <Card className="flex flex-col justify-center p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("report.pagesScanned")}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{pagesScanned}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("report.wcagLevel", { level: wcagLevel })}</p>
        </Card>
      </section>

      {/* Breakdown by impact */}
      <section aria-label={t("report.byImpactAria")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {IMPACT_LEVELS.map((level) => (
          <div key={level} className={`rounded-lg p-3 ${IMPACT_BADGE[level]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">{t("impact." + level)}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totals[level]}</p>
          </div>
        ))}
      </section>

      {/* Honesty principle — required on every report */}
      <section
        aria-label={t("report.manualChecksAria")}
        className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm"
      >
        <p className="font-medium text-warning-strong">{t("report.honestyTitle")}</p>
        <p className="mt-1 text-muted-foreground">{t("report.honestyBody", { level: wcagLevel })}</p>
      </section>

      {/* Per-page results */}
      {pages.length > 1 ? (
        <section aria-label={t("report.byPageAria")} className="space-y-3">
          <h2 className="text-lg font-medium">{t("report.pagesHeading")}</h2>
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {pages.map((page) => (
                <li
                  key={page.url}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={page.url}>
                      {page.url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {page.status === "ok"
                        ? t.plural("report.issuesCount", totalViolations(page.totals))
                        : page.httpStatus
                          ? t("report.errorHttp", { status: page.httpStatus })
                          : t("report.error")}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${scoreClassName(page.score)}`}>
                    {page.score != null ? `${page.score}/100` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      {/* Violation detail */}
      <section aria-label={t("report.violationsAria")} className="space-y-3">
        <h2 className="text-lg font-medium">{t("report.violationsHeading", { count: groups.length })}</h2>
        {truncated ? (
          <div
            role="status"
            className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-strong"
          >
            {t.plural("report.truncatedNotice", groups.length, {
              shown: totalViolationRows != null ? 1000 : t("report.loadedFindings"),
              total: totalViolationRows ?? t("report.manyFindings"),
            })}
          </div>
        ) : null}
        {groups.length === 0 ? (
          <div className="rounded-lg border border-success/30 bg-success/10 p-5 text-center text-sm text-success-strong">
            {t("report.noViolations", { level: wcagLevel })}
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li
                key={group.ruleId}
                className={`overflow-hidden rounded-lg border border-s-4 bg-card ${
                  IMPACT_ACCENT[group.impact] ?? "border-s-border"
                }`}
              >
                <details open={expanded} className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 transition-colors hover:bg-muted/40">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant={group.impact}>{t("impact." + group.impact)}</Badge>
                        <code className="font-mono text-sm font-semibold">{group.ruleId}</code>
                        {group.wcagCriteria.length > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {t("report.wcagCriteria", { criteria: group.wcagCriteria.join(", ") })}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 block text-sm text-muted-foreground">
                        {group.helpText ?? group.description ?? ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {t.plural("report.elementsCount", group.nodeCount)}
                      <ChevronDown
                        className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 print:hidden"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>

                  <div className="space-y-4 border-t px-4 py-4">
                    {group.description ? <p className="text-sm">{group.description}</p> : null}
                    {group.helpUrl ? (
                      <a
                        href={group.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm font-medium text-brand underline-offset-4 hover:underline"
                      >
                        {t("report.howToFix")}
                      </a>
                    ) : null}

                    {(() => {
                      const view = expanded
                        ? { occurrences: group.occurrences, hidden: 0 }
                        : capOccurrences(group, MAX_NODES_PER_GROUP);
                      return (
                        <>
                          {view.occurrences.map((occ, i) => (
                            <div key={`${occ.pageUrl}-${i}`} className="space-y-2">
                              <p className="truncate text-xs text-muted-foreground" title={occ.pageUrl}>
                                {occ.pageUrl}
                              </p>
                              {occ.nodes.map((node, j) => (
                                <div key={j} className="rounded-md border bg-muted/60 p-3">
                                  {node.target.length > 0 ? (
                                    <code className="block font-mono text-xs font-semibold">
                                      {node.target.join(" ")}
                                    </code>
                                  ) : null}
                                  {node.html ? (
                                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
                                      {node.html}
                                    </pre>
                                  ) : null}
                                  {node.failureSummary ? (
                                    <p className="mt-1 text-xs text-muted-foreground">{node.failureSummary}</p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ))}
                          {view.hidden > 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {t.plural("report.moreElements", view.hidden)}
                            </p>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {finishedAt ? (
        <p className="text-xs text-muted-foreground">
          {t("report.completed", { date: formatDateTime(finishedAt, locale) })}
        </p>
      ) : null}
    </div>
  );
}
