/**
 * Domain taxonomies shared by the web app and the scan worker. These mirror the
 * Postgres enums in supabase/migrations/0001 — keep them in sync.
 */

export const IMPACT_LEVELS = ["critical", "serious", "moderate", "minor"] as const;
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];

export const SCAN_STATUSES = ["queued", "running", "completed", "failed", "partial"] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];

export const SCAN_TYPES = ["single", "list"] as const;
export type ScanType = (typeof SCAN_TYPES)[number];

export const WCAG_LEVELS = ["A", "AA", "AAA"] as const;
export type WcagLevel = (typeof WCAG_LEVELS)[number];

export const PAGE_STATUSES = ["ok", "error"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

/** Counts of violations by impact — the shape stored in scans/scan_pages.totals. */
export type ImpactTotals = Record<ImpactLevel, number>;

export const EMPTY_TOTALS: ImpactTotals = { critical: 0, serious: 0, moderate: 0, minor: 0 };

/**
 * Per-impact penalty weights used to turn a violation count into a 0–100 score.
 * Tuned so a few criticals hurt far more than many minors. The worker is the
 * source of truth for scoring; this constant keeps web + worker aligned.
 */
export const IMPACT_WEIGHTS: Record<ImpactLevel, number> = {
  critical: 10,
  serious: 5,
  moderate: 2,
  minor: 1,
};

/**
 * Simple, transparent scoring: start at 100, subtract weighted penalties, floor
 * at 0. Returns a number rounded to 2 decimals (matches numeric(5,2)).
 */
export function scoreFromTotals(totals: ImpactTotals): number {
  const penalty =
    totals.critical * IMPACT_WEIGHTS.critical +
    totals.serious * IMPACT_WEIGHTS.serious +
    totals.moderate * IMPACT_WEIGHTS.moderate +
    totals.minor * IMPACT_WEIGHTS.minor;
  const raw = Math.max(0, 100 - penalty);
  return Math.round(raw * 100) / 100;
}

/** Sum a list of per-page totals into one rollup. */
export function sumTotals(pages: ImpactTotals[]): ImpactTotals {
  return pages.reduce<ImpactTotals>(
    (acc, t) => ({
      critical: acc.critical + t.critical,
      serious: acc.serious + t.serious,
      moderate: acc.moderate + t.moderate,
      minor: acc.minor + t.minor,
    }),
    { ...EMPTY_TOTALS },
  );
}
