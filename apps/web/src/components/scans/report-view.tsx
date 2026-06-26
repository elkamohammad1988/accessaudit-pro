import { ChevronDown } from "lucide-react";
import { IMPACT_LEVELS, scoreBand, type ImpactTotals, type ScanStatus } from "@accessaudit/shared";
import { IMPACT_BADGE, IMPACT_LABEL, scoreClassName, STATUS_META, totalViolations } from "@/lib/scan-format";
import { formatDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoreGauge } from "@/components/charts/score-gauge";
import type { GroupedViolation } from "@/lib/report";

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
}: ReportViewProps) {
  const issues = totalViolations(totals);
  const inProgress = status === "queued" || status === "running";
  const failedPages = Math.max(0, pages.length - pagesScanned);
  const band = scoreBand(score);
  const criticalAndSerious = totals.critical + totals.serious;

  if (inProgress) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-8 text-center">
        <p className="flex items-center justify-center gap-2 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
          </span>
          {STATUS_META[status].label}…
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The worker is auditing your page(s). This view updates automatically.
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 p-6">
        <p className="font-medium text-danger">Scan failed</p>
        <p className="mt-1 text-sm text-danger/90">{errorReason ?? "Unknown error."}</p>
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
          <p className="font-medium text-warning">Partial scan — {failedPages} page(s) could not be loaded</p>
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
            <span className={criticalAndSerious > 0 ? "font-semibold text-danger" : undefined}>
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
        <p className="font-medium text-warning">Automated scan — manual checks still recommended</p>
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
          <ul className="divide-y rounded-lg border bg-card">
            {pages.map((page) => (
              <li key={page.url} className="flex items-center justify-between gap-4 px-4 py-3">
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
        </section>
      ) : null}

      {/* Violation detail */}
      <section aria-label="Violations" className="space-y-3">
        <h2 className="text-lg font-medium">Violations ({groups.length})</h2>
        {groups.length === 0 ? (
          <div className="rounded-lg border border-success/30 bg-success/10 p-6 text-center text-sm text-success">
            No automated WCAG {wcagLevel} violations found. Nice — still worth a manual review.
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.ruleId} className="overflow-hidden rounded-lg border bg-card">
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

                    {group.occurrences.map((occ, i) => (
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
