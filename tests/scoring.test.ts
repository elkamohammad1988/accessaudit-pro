import { describe, it, expect } from "vitest";
import {
  EMPTY_TOTALS,
  penaltyFromTotals,
  scoreBand,
  scoreFromPages,
  scoreFromTotals,
  sumTotals,
  type ImpactTotals,
} from "@accessaudit/shared";

describe("penaltyFromTotals", () => {
  it("weights criticals heaviest (critical=10, serious=5, moderate=2, minor=1)", () => {
    expect(penaltyFromTotals({ critical: 1, serious: 1, moderate: 1, minor: 1 })).toBe(18);
    expect(penaltyFromTotals(EMPTY_TOTALS)).toBe(0);
  });
});

describe("scoreFromTotals", () => {
  it("is 100 for a clean page", () => {
    expect(scoreFromTotals(EMPTY_TOTALS)).toBe(100);
  });

  it("scores a single critical issue around 90", () => {
    expect(scoreFromTotals({ critical: 1, serious: 0, moderate: 0, minor: 0 })).toBeCloseTo(90.03, 1);
  });

  it("decays smoothly and NEVER floors to 0 for pathological pages (the old bug)", () => {
    // 20 criticals used to floor at exactly 0; now it stays a meaningful, low score.
    const pathological = scoreFromTotals({ critical: 20, serious: 0, moderate: 0, minor: 0 });
    expect(pathological).toBeGreaterThan(0);
    expect(pathological).toBeLessThan(20);
  });

  it("is monotonic — more/worse issues always lower the score", () => {
    const a = scoreFromTotals({ critical: 1, serious: 0, moderate: 0, minor: 0 });
    const b = scoreFromTotals({ critical: 2, serious: 0, moderate: 0, minor: 0 });
    const c = scoreFromTotals({ critical: 2, serious: 3, moderate: 0, minor: 0 });
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  });

  it("stays within [0, 100] and rounds to 2 decimals (numeric(5,2))", () => {
    const score = scoreFromTotals({ critical: 3, serious: 2, moderate: 4, minor: 7 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(Math.round(score * 100))).toBe(true);
  });
});

describe("scoreFromPages", () => {
  it("is 100 for an empty or all-clean scan", () => {
    expect(scoreFromPages([])).toBe(100);
    expect(scoreFromPages([EMPTY_TOTALS, EMPTY_TOTALS])).toBe(100);
  });

  it("equals the page score for a single-page scan", () => {
    const t: ImpactTotals = { critical: 1, serious: 2, moderate: 0, minor: 1 };
    expect(scoreFromPages([t])).toBe(scoreFromTotals(t));
  });

  it("normalizes per page so a large clean-ish site is NOT pinned at 0 (the headline fix)", () => {
    // 50 pages each with one critical: the old summed model = 0; normalized ≈ one critical's score.
    const pages: ImpactTotals[] = Array.from({ length: 50 }, () => ({
      critical: 1,
      serious: 0,
      moderate: 0,
      minor: 0,
    }));
    const overall = scoreFromPages(pages);
    expect(overall).toBeCloseTo(scoreFromTotals({ critical: 1, serious: 0, moderate: 0, minor: 0 }), 1);
    expect(overall).toBeGreaterThan(80);
  });
});

describe("scoreBand", () => {
  it("bands by tone", () => {
    expect(scoreBand(95).tone).toBe("success");
    expect(scoreBand(75).tone).toBe("warning");
    expect(scoreBand(40).tone).toBe("danger");
    expect(scoreBand(null).tone).toBe("muted");
  });

  it("uses 90 and 70 as the boundaries", () => {
    expect(scoreBand(90).tone).toBe("success");
    expect(scoreBand(89.99).tone).toBe("warning");
    expect(scoreBand(70).tone).toBe("warning");
    expect(scoreBand(69.99).tone).toBe("danger");
  });
});

describe("sumTotals", () => {
  it("merges per-page totals into one rollup", () => {
    expect(
      sumTotals([
        { critical: 1, serious: 2, moderate: 0, minor: 1 },
        { critical: 0, serious: 1, moderate: 3, minor: 0 },
      ]),
    ).toEqual({ critical: 1, serious: 3, moderate: 3, minor: 1 });
  });

  it("returns empty totals for no pages", () => {
    expect(sumTotals([])).toEqual(EMPTY_TOTALS);
  });
});
