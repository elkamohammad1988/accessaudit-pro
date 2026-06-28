import { describe, it, expect, vi } from "vitest";

// persistence.ts imports the service-role Supabase client, which reads env at
// module load. Mock it so we can unit-test the pure `summarize` rollup in isolation.
vi.mock("../apps/worker/src/supabase", () => ({ supabase: {} }));

import { summarize } from "../apps/worker/src/persistence";
import type { PageScanResult, AxeViolationLite } from "../apps/worker/src/scanner";

const violation = (impact: AxeViolationLite["impact"]): AxeViolationLite => ({
  ruleId: "rule",
  impact,
  wcagTags: [],
  description: null,
  help: null,
  helpUrl: null,
  nodes: [],
});

const ok = (violations: AxeViolationLite[] = []): PageScanResult => ({
  url: "https://example.com",
  ok: true,
  httpStatus: 200,
  violations,
});

const failed = (error = "boom"): PageScanResult => ({
  url: "https://bad.example",
  ok: false,
  httpStatus: null,
  error,
  violations: [],
});

describe("summarize (worker scan rollup)", () => {
  it("marks all-ok scans as neither all- nor any-failed", () => {
    const s = summarize([ok(), ok()]);
    expect(s.allFailed).toBe(false);
    expect(s.anyFailed).toBe(false);
    expect(s.pagesScanned).toBe(2);
    expect(s.firstError).toBeNull();
  });

  it("flags anyFailed (partial) and surfaces the first error", () => {
    const s = summarize([ok(), failed("HTTP 500")]);
    expect(s.allFailed).toBe(false);
    expect(s.anyFailed).toBe(true);
    expect(s.pagesScanned).toBe(1);
    expect(s.firstError).toBe("HTTP 500");
  });

  it("flags allFailed when no page scanned successfully", () => {
    const s = summarize([failed(), failed()]);
    expect(s.allFailed).toBe(true);
    expect(s.pagesScanned).toBe(0);
  });

  it("aggregates totals and keeps the score within 0..100", () => {
    const s = summarize([ok([violation("critical"), violation("minor")]), ok()]);
    expect(s.totals.critical).toBe(1);
    expect(s.totals.minor).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });

  it("treats an empty scan as a perfect, fully-successful run", () => {
    const s = summarize([ok()]);
    expect(s.score).toBe(100);
    expect(s.allFailed).toBe(false);
  });
});
