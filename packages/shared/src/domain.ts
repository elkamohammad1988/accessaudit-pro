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
 * Decay constant for the score curve. Calibrated so a single critical issue on a
 * page (penalty 10) scores ≈90, then the score decays smoothly toward — but never
 * reaches — 0. A linear "100 − penalty" floor was abandoned because it pinned any
 * real multi-page site at 0, erasing the difference between "a few issues" and
 * "catastrophic". With exponential decay the metric stays meaningful across the
 * whole range. ln(2)/k ≈ 66 penalty points halves the score.
 */
export const SCORE_DECAY_K = 0.0105;

/** Weighted penalty for one set of impact counts. */
export function penaltyFromTotals(totals: ImpactTotals): number {
  return (
    totals.critical * IMPACT_WEIGHTS.critical +
    totals.serious * IMPACT_WEIGHTS.serious +
    totals.moderate * IMPACT_WEIGHTS.moderate +
    totals.minor * IMPACT_WEIGHTS.minor
  );
}

/** Map a penalty to a 0–100 score via exponential decay. Rounded to 2dp (numeric(5,2)). */
function scoreFromPenalty(penalty: number): number {
  const raw = 100 * Math.exp(-SCORE_DECAY_K * Math.max(0, penalty));
  return Math.round(raw * 100) / 100;
}

/**
 * Score (0–100) for a single page from its violation counts. Clean page = 100.
 */
export function scoreFromTotals(totals: ImpactTotals): number {
  return scoreFromPenalty(penaltyFromTotals(totals));
}

/**
 * Overall scan score across pages. Penalty is averaged per page so a large site
 * is judged on typical page health, not the raw sum of every issue (which would
 * pin any multi-page site at 0). A 1-page scan equals that page's score; an empty
 * or all-clean scan is 100.
 */
export function scoreFromPages(pages: ImpactTotals[]): number {
  if (pages.length === 0) return 100;
  const totalPenalty = pages.reduce((sum, totals) => sum + penaltyFromTotals(totals), 0);
  return scoreFromPenalty(totalPenalty / pages.length);
}

/** Semantic tone for a score, shared by every UI that colors a score. */
export type ScoreTone = "success" | "warning" | "danger" | "muted";

export function scoreBand(score: number | null): { label: string; tone: ScoreTone } {
  if (score === null) return { label: "Not scored", tone: "muted" };
  if (score >= 90) return { label: "Good", tone: "success" };
  if (score >= 70) return { label: "Needs work", tone: "warning" };
  return { label: "Poor", tone: "danger" };
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
