import type { ImpactTotals } from "@accessaudit/shared";
import { EMPTY_TOTALS, scoreFromTotals, sumTotals } from "@accessaudit/shared";
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

/**
 * Write per-page results and their violations, then return a rollup the caller
 * uses to finalize the scan row. organization_id comes only from the claimed
 * scan — never from page content.
 */
export async function persistResults(
  scan: { id: string; organization_id: string },
  pages: PageScanResult[],
): Promise<ScanSummary> {
  const okPageTotals: ImpactTotals[] = [];
  let okCount = 0;
  let firstError: string | null = null;

  for (const page of pages) {
    const totals = totalsFromViolations(page.violations);
    if (page.ok) {
      okPageTotals.push(totals);
      okCount += 1;
    } else if (!firstError) {
      firstError = page.error ?? "Page could not be scanned.";
    }

    const { data: pageRow, error: pageErr } = await supabase
      .from("scan_pages")
      .insert({
        scan_id: scan.id,
        organization_id: scan.organization_id,
        url: page.url,
        status: page.ok ? "ok" : "error",
        http_status: page.httpStatus,
        score: page.ok ? scoreFromTotals(totals) : null,
        totals,
      })
      .select("id")
      .single();

    if (pageErr || !pageRow) {
      throw new Error(`Failed to insert scan_page for ${page.url}: ${pageErr?.message ?? "no row"}`);
    }

    if (page.ok && page.violations.length > 0) {
      const rows = page.violations.map((v) => ({
        scan_page_id: pageRow.id,
        organization_id: scan.organization_id,
        rule_id: v.ruleId,
        impact: v.impact,
        wcag_criteria: criteriaFromTags(v.wcagTags),
        description: v.description,
        help_text: v.help,
        help_url: v.helpUrl,
        nodes: v.nodes,
      }));
      const { error: vErr } = await supabase.from("violations").insert(rows);
      if (vErr) {
        throw new Error(`Failed to insert violations for ${page.url}: ${vErr.message}`);
      }
    }
  }

  const scanTotals = sumTotals(okPageTotals);
  return {
    totals: scanTotals,
    score: scoreFromTotals(scanTotals),
    pagesScanned: okCount,
    allFailed: okCount === 0,
    anyFailed: okCount !== pages.length,
    firstError,
  };
}
