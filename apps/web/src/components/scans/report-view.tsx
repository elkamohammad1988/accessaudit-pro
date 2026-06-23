import { IMPACT_LEVELS, type ImpactTotals, type ScanStatus } from "@accessaudit/shared";
import {
  IMPACT_BADGE,
  IMPACT_LABEL,
  scoreClassName,
  STATUS_META,
  totalViolations,
} from "@/lib/scan-format";
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
  // For a partial scan, `pagesScanned` counts only pages that loaded; the score
  // and totals are computed from those alone, so call out the missing pages.
  const failedPages = Math.max(0, pages.length - pagesScanned);

  if (inProgress) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">{STATUS_META[status].label}…</p>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          The worker is auditing your page(s). This view updates automatically.
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">Scan failed</p>
        <p className="mt-1 text-sm text-red-700">{errorReason ?? "Unknown error."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {status === "partial" && failedPages > 0 ? (
        <section
          aria-label="Partial scan"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-medium">Partial scan — {failedPages} page(s) could not be loaded</p>
          <p className="mt-1">
            The score and totals below reflect only the {pagesScanned} page(s) that loaded
            successfully. Check the per-page list for the URLs that failed, then re-scan if needed.
          </p>
        </section>
      ) : null}

      {/* Summary */}
      <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Score</p>
          <p className={`mt-1 text-3xl font-bold ${scoreClassName(score)}`}>
            {score != null ? score : "—"}
            <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">/100</span>
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Issues found</p>
          <p className="mt-1 text-3xl font-bold">{issues}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Pages scanned</p>
          <p className="mt-1 text-3xl font-bold">{pagesScanned}</p>
        </div>
      </section>

      {/* Breakdown by impact */}
      <section aria-label="By impact" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {IMPACT_LEVELS.map((level) => (
          <div key={level} className={`rounded-lg border p-3 ${IMPACT_BADGE[level]}`}>
            <p className="text-xs font-medium uppercase tracking-wide">{IMPACT_LABEL[level]}</p>
            <p className="mt-1 text-2xl font-bold">{totals[level]}</p>
          </div>
        ))}
      </section>

      {/* Honesty principle — required on every report */}
      <section
        aria-label="Manual checks recommended"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <p className="font-medium">Automated scan — manual checks still recommended</p>
        <p className="mt-1">
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
          <ul className="divide-y rounded-lg border">
            {pages.map((page) => (
              <li key={page.url} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={page.url}>
                    {page.url}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {page.status === "ok"
                      ? `${totalViolations(page.totals)} issue(s)`
                      : `Error${page.httpStatus ? ` · HTTP ${page.httpStatus}` : ""}`}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${scoreClassName(page.score)}`}>
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
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center text-sm text-green-800">
            No automated WCAG {wcagLevel} violations found. Nice — still worth a manual review.
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.ruleId} className="rounded-lg border">
                <details open={expanded}>
                  <summary className="flex cursor-pointer items-start justify-between gap-3 p-4">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${IMPACT_BADGE[group.impact]}`}
                        >
                          {IMPACT_LABEL[group.impact]}
                        </span>
                        <code className="text-sm font-semibold">{group.ruleId}</code>
                        {group.wcagCriteria.length > 0 ? (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            WCAG {group.wcagCriteria.join(", ")}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">
                        {group.helpText ?? group.description ?? ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">
                      {group.nodeCount} element(s)
                    </span>
                  </summary>

                  <div className="space-y-4 border-t px-4 py-4">
                    {group.description ? <p className="text-sm">{group.description}</p> : null}
                    {group.helpUrl ? (
                      <a
                        href={group.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-brand underline-offset-4 hover:underline"
                      >
                        How to fix this →
                      </a>
                    ) : null}

                    {group.occurrences.map((occ, i) => (
                      <div key={`${occ.pageUrl}-${i}`} className="space-y-2">
                        <p className="truncate text-xs text-[hsl(var(--muted-foreground))]" title={occ.pageUrl}>
                          {occ.pageUrl}
                        </p>
                        {occ.nodes.map((node, j) => (
                          <div key={j} className="rounded-md bg-[hsl(var(--muted))] p-3">
                            {node.target.length > 0 ? (
                              <code className="block text-xs font-semibold">{node.target.join(" ")}</code>
                            ) : null}
                            {node.html ? (
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-xs">
                                {node.html}
                              </pre>
                            ) : null}
                            {node.failureSummary ? (
                              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                {node.failureSummary}
                              </p>
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
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Completed {new Date(finishedAt).toLocaleString()}.
        </p>
      ) : null}
    </div>
  );
}
