import type { ImpactTotals } from "@accessaudit/shared";
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
 * Write a scan's pages + violations and return a rollup the caller uses to
 * finalize the scan row. The whole write goes through `persist_scan_results`,
 * a single transactional RPC that does a delete-then-insert — so a retried scan
 * can't leave duplicated or half-written results. organization_id comes only
 * from the claimed scan, never from page content.
 */
export async function persistResults(
  scan: { id: string; organization_id: string },
  pages: PageScanResult[],
): Promise<ScanSummary> {
  const okPageTotals: ImpactTotals[] = [];
  let okCount = 0;
  let firstError: string | null = null;

  const payload = pages.map((page) => {
    const totals = totalsFromViolations(page.violations);
    if (page.ok) {
      okPageTotals.push(totals);
      okCount += 1;
    } else if (!firstError) {
      firstError = page.error ?? "Page could not be scanned.";
    }
    return pagePayload(page, totals);
  });

  const { error } = await supabase.rpc("persist_scan_results", {
    p_scan_id: scan.id,
    p_org_id: scan.organization_id,
    p_pages: payload,
  });
  if (error) {
    throw new Error(`Failed to persist scan results: ${error.message}`);
  }

  return {
    totals: sumTotals(okPageTotals),
    // Overall score is normalized per page (not the raw sum) so a large site is
    // judged on typical page health. Per-page scores stay un-normalized above.
    score: scoreFromPages(okPageTotals),
    pagesScanned: okCount,
    allFailed: okCount === 0,
    anyFailed: okCount !== pages.length,
    firstError,
  };
}
