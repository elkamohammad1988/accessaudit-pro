import { describe, it, expect } from "vitest";
import { EMPTY_TOTALS, scoreFromTotals, sumTotals } from "@accessaudit/shared";

describe("scoreFromTotals", () => {
  it("is 100 for a clean page", () => {
    expect(scoreFromTotals(EMPTY_TOTALS)).toBe(100);
  });

  it("subtracts weighted penalties (critical=10, serious=5, moderate=2, minor=1)", () => {
    expect(scoreFromTotals({ critical: 1, serious: 0, moderate: 0, minor: 0 })).toBe(90);
    expect(scoreFromTotals({ critical: 0, serious: 1, moderate: 1, minor: 1 })).toBe(92);
  });

  it("floors at 0 for pathological pages", () => {
    expect(scoreFromTotals({ critical: 20, serious: 0, moderate: 0, minor: 0 })).toBe(0);
  });

  it("rounds to 2 decimals (matches numeric(5,2))", () => {
    const score = scoreFromTotals({ critical: 0, serious: 0, moderate: 0, minor: 3 });
    expect(score).toBe(97);
    expect(Number.isInteger(score * 100)).toBe(true);
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
