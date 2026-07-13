import type { ImpactTotals, ScanStatus } from "@accessaudit/shared";
import { EMPTY_TOTALS, scoreFromPages, scoreFromTotals, sumTotals } from "@accessaudit/shared";
import { supabase } from "./supabase";
import { criteriaFromTags } from "./wcag";
import type { PageScanResult } from "./scanner";

export interface ScanSummary {
  totals: ImpactTotals;
  score: number;
  pagesScanned: number;
  /** No page scanned successfully. */
  allFailed: boolean;
  /** At least one page failed (but not all). */
  anyFailed: boolean;
  firstError: string | null;
}

function totalsFromViolations(violations: PageScanResult["violations"]): ImpactTotals {
  const totals: ImpactTotals = { ...EMPTY_TOTALS };
  for (const v of violations) {
    totals[v.impact] += 1;
  }
  return totals;
}

/** Shape one page (and its violations) into the JSONB the persist RPC expects. */
function pagePayload(page: PageScanResult, totals: ImpactTotals) {
  return {
    url: page.url,
    status: page.ok ? "ok" : "error",
    http_status: page.httpStatus,
    score: page.ok ? scoreFromTotals(totals) : null,
    totals,
    violations: page.ok
      ? page.violations.map((v) => ({
          rule_id: v.ruleId,
          impact: v.impact,
          wcag_criteria: criteriaFromTags(v.wcagTags),
          description: v.description,
          help_text: v.help,
          help_url: v.helpUrl,
          nodes: v.nodes,
        }))
      : [],
  };
}

/**
 * Roll up scanned pages into the scan-level summary. Pure (no DB) — derived
 * entirely from the in-memory results — so the caller can decide the terminal
 * status (and whether to persist at all) BEFORE writing.
 */
export function summarize(pages: PageScanResult[]): ScanSummary {
  const okPageTotals: ImpactTotals[] = [];
  let okCount = 0;
  let scannedCount = 0;
  let firstError: string | null = null;

  for (const page of pages) {
    // Defensive: `scanAllPages` pre-sizes its result array and fills by index, so
    // an interrupted (shutdown) scan can leave holes. Skip them rather than deref
    // `undefined.ok` — the caller also short-circuits interrupted scans, but a
    // rollup that never crashes on a sparse array is the safer contract.
    if (!page) continue;
    scannedCount += 1;
    if (page.ok) {
      okPageTotals.push(totalsFromViolations(page.violations));
      okCount += 1;
    } else if (!firstError) {
      firstError = page.error ?? "Page could not be scanned.";
    }
  }

  return {
    totals: sumTotals(okPageTotals),
    // Overall score is normalized per page (not the raw sum) so a large site is
    // judged on typical page health. Per-page scores stay un-normalized.
    score: scoreFromPages(okPageTotals),
    pagesScanned: okCount,
    allFailed: okCount === 0,
    // Compare against pages actually attempted (holes excluded), not the raw
    // pre-sized length, so an interrupted run isn't mislabeled "partial".
    anyFailed: okCount !== scannedCount,
    firstError,
  };
}

/**
 * Write a scan's pages + violations AND finalize the scan row in ONE transaction
 * via `persist_scan_results`. The RPC is guarded on status='running' (with a row
 * lock), so a stale worker can't resurrect a scan the reaper already took over;
 * it returns false in that case. organization_id comes only from the claimed
 * scan, never from page content. Returns true when the write was applied.
 */
export async function persistAndFinalize(
  scan: { id: string; organization_id: string },
  pages: PageScanResult[],
  status: Extract<ScanStatus, "completed" | "partial">,
  summary: ScanSummary,
): Promise<boolean> {
  // Drop any holes a shutdown-interrupted scan may have left in the pre-sized
  // result array before shaping the payload (see `summarize`).
  const payload = pages
    .filter((page): page is PageScanResult => Boolean(page))
    .map((page) => pagePayload(page, totalsFromViolations(page.violations)));

  const { data, error } = await supabase.rpc("persist_scan_results", {
    p_scan_id: scan.id,
    p_org_id: scan.organization_id,
    p_pages: payload,
    p_status: status,
    p_score: summary.score,
    p_totals: summary.totals,
    p_pages_scanned: summary.pagesScanned,
    p_error_reason: null,
  });
  if (error) {
    throw new Error(`Failed to persist scan results: ${error.message}`);
  }
  return data ?? false;
}
