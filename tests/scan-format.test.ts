import { describe, it, expect } from "vitest";
import { parseTotals, totalViolations, scoreClassName, STATUS_META } from "../apps/web/src/lib/scan-format";

describe("parseTotals", () => {
  it("reads a well-formed totals object", () => {
    expect(parseTotals({ critical: 2, serious: 1, moderate: 0, minor: 3 })).toEqual({
      critical: 2,
      serious: 1,
      moderate: 0,
      minor: 3,
    });
  });

  it("fills missing keys with 0 and ignores junk", () => {
    expect(parseTotals({ critical: 1 })).toEqual({ critical: 1, serious: 0, moderate: 0, minor: 0 });
    expect(parseTotals(null)).toEqual({ critical: 0, serious: 0, moderate: 0, minor: 0 });
    expect(parseTotals([1, 2, 3])).toEqual({ critical: 0, serious: 0, moderate: 0, minor: 0 });
  });
});

describe("totalViolations", () => {
  it("sums all impact buckets", () => {
    expect(totalViolations({ critical: 2, serious: 5, moderate: 3, minor: 1 })).toBe(11);
  });
});

describe("scoreClassName", () => {
  it("bands the score by semantic tone", () => {
    expect(scoreClassName(95)).toBe("text-success");
    expect(scoreClassName(75)).toBe("text-warning");
    expect(scoreClassName(40)).toBe("text-danger");
    expect(scoreClassName(null)).toBe("text-muted-foreground");
  });
});

describe("STATUS_META", () => {
  it("marks completed/failed/partial as terminal and queued/running as not", () => {
    expect(STATUS_META.completed.terminal).toBe(true);
    expect(STATUS_META.failed.terminal).toBe(true);
    expect(STATUS_META.partial.terminal).toBe(true);
    expect(STATUS_META.queued.terminal).toBe(false);
    expect(STATUS_META.running.terminal).toBe(false);
  });
});
