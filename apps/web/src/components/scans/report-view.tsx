import { ChevronDown } from "lucide-react";
import { IMPACT_LEVELS, scoreBand, type ImpactTotals, type ScanStatus } from "@accessaudit/shared";
import { IMPACT_BADGE, IMPACT_LABEL, scoreClassName, STATUS_META, totalViolations } from "@/lib/scan-format";
import { formatDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoreGauge } from "@/components/charts/score-gauge";
import type { GroupedViolation } from "@/lib/report";

/** Left-edge accent per impact level — lets a reader scan severity at a glance. */
const IMPACT_ACCENT: Record<string, string> = {
  critical: "border-l-critical",
  serious: "border-l-serious",
  moderate: "border-l-moderate",
  minor: "border-l-minor",
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
  const issues = totalViolations(totals);
  const inProgress = status === "queued" || status === "running";
  const failedPages = Math.max(0, pages.length - pagesScanned);
  const band = scoreBand(score);
  const criticalAndSerious = totals.critical + totals.serious;

  if (inProgress) {
    return (
      <div className="relative overflow-hidden rounded-lg border bg-card p-8 text-center shadow-sm">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-24 w-40 -translate-x-1/2 rounded-full bg-brand/10 blur-2xl"
        />
        <div className="relative">
          <p className="flex items-center justify-center gap-2 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
            </span>
            {STATUS_META[status].label}…
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            The worker is auditing your page(s). This view updates automatically.
          </p>
          <div
            role="progressbar"
            aria-label="Scan in progress"
            className="mx-auto mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand to-brand-2 animate-progress-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 p-6">
        <p className="font-medium text-danger-strong">Scan failed</p>
        <p className="mt-1 text-sm text-danger-strong/90">{errorReason ?? "Unknown error."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {status === "partial" && failedPages > 0 ? (
        <section
          aria-label="Partial scan"
          className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm"
        >
          <p className="font-medium text-warning-strong">Partial scan — {failedPages} page(s) could not be loaded</p>
          <p className="mt-1 text-muted-foreground">
            The score and totals below reflect only the {pagesScanned} page(s) that loaded
            successfully. Check the per-page list for the URLs that failed, then re-scan if needed.
          </p>
        </section>
      ) : null}

      {/* Summary */}
      <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="relative flex flex-col items-center justify-center gap-3 overflow-hidden p-6 text-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-brand/10 blur-2xl print:hidden"
          />
          <ScoreGauge score={score} />
          <div className="space-y-1">
            <Badge variant={band.tone === "muted" ? "secondary" : band.tone}>{band.label}</Badge>
            <p className="text-xs text-muted-foreground">Accessibility score</p>
          </div>
        </Card>
        <Card className="flex flex-col justify-center p-6">
          <p className="text-sm text-muted-foreground">Issues found</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{issues}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className={criticalAndSerious > 0 ? "font-semibold text-danger-strong" : undefined}>
              {criticalAndSerious}
            </span>{" "}
            critical or serious
          </p>
        </Card>
        <Card className="flex flex-col justify-center p-6">
          <p className="text-sm text-muted-foreground">Pages scanned</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{pagesScanned}</p>
          <p className="mt-1 text-xs text-muted-foreground">WCAG 2.2 Level {wcagLevel}</p>
        </Card>
      </section>

      {/* Breakdown by impact */}
      <section aria-label="By impact" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {IMPACT_LEVELS.map((level) => (
          <div key={level} className={`rounded-lg p-3 ${IMPACT_BADGE[level]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">{IMPACT_LABEL[level]}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totals[level]}</p>
          </div>
        ))}
      </section>

      {/* Honesty principle — required on every report */}
      <section
        aria-label="Manual checks recommended"
        className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm"
      >
        <p className="font-medium text-warning-strong">Automated scan — manual checks still recommended</p>
        <p className="mt-1 text-muted-foreground">
          This audit targets WCAG 2.2 Level {wcagLevel} using automated rules (axe-core), which
          catch roughly 30–50% of issues. It does not replace human review of things like
          meaningful alt-text quality, logical reading/focus order, keyboard traps, captions, and
          cognitive clarity. Use it to fix the clear failures fast, then review the rest manually.
        </p>
      </section>

      {/* Per-page results */}
      {pages.length > 1 ? (
        <section aria-label="By page" className="space-y-3">
          <h2 className="text-lg font-medium">Pages</h2>
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {pages.map((page) => (
                <li
                  key={page.url}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={page.url}>
                      {page.url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {page.status === "ok"
                        ? `${totalViolations(page.totals)} issue(s)`
                        : `Error${page.httpStatus ? ` · HTTP ${page.httpStatus}` : ""}`}
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
      <section aria-label="Violations" className="space-y-3">
        <h2 className="text-lg font-medium">Violations ({groups.length})</h2>
        {truncated ? (
          <div
            role="status"
            className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-strong"
          >
            Showing the {groups.length} highest-severity rule(s) covering the first{" "}
            {totalViolationRows != null ? "1,000" : "loaded"} findings of{" "}
            {totalViolationRows?.toLocaleString() ?? "many"}. Export the CSV for the complete,
            authoritative record.
          </div>
        ) : null}
        {groups.length === 0 ? (
          <div className="rounded-lg border border-success/30 bg-success/10 p-6 text-center text-sm text-success-strong">
            No automated WCAG {wcagLevel} violations found. Nice — still worth a manual review.
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li
                key={group.ruleId}
                className={`overflow-hidden rounded-lg border border-l-4 bg-card ${
                  IMPACT_ACCENT[group.impact] ?? "border-l-border"
                }`}
              >
                <details open={expanded} className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 transition-colors hover:bg-muted/40">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant={group.impact}>{IMPACT_LABEL[group.impact]}</Badge>
                        <code className="font-mono text-sm font-semibold">{group.ruleId}</code>
                        {group.wcagCriteria.length > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            WCAG {group.wcagCriteria.join(", ")}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 block text-sm text-muted-foreground">
                        {group.helpText ?? group.description ?? ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {group.nodeCount} element(s)
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
                        How to fix this →
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
                              + {view.hidden.toLocaleString()} more affected element(s). Export the CSV
                              for the full list.
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
        <p className="text-xs text-muted-foreground">Completed {formatDateTime(finishedAt)}.</p>
      ) : null}
    </div>
  );
}
