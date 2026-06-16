import { describe, it, expect } from "vitest";
import { criteriaFromTags, tagsForLevel } from "../apps/worker/src/wcag";

describe("tagsForLevel", () => {
  it("A excludes AA tags", () => {
    const tags = tagsForLevel("A");
    expect(tags).toContain("wcag2a");
    expect(tags).not.toContain("wcag2aa");
  });

  it("AA is a superset of A and includes 2.2 AA", () => {
    const tags = tagsForLevel("AA");
    expect(tags).toContain("wcag2a");
    expect(tags).toContain("wcag22aa");
  });
});

describe("criteriaFromTags", () => {
  it("converts axe criterion tags to dotted WCAG numbers", () => {
    expect(criteriaFromTags(["wcag111", "wcag143"])).toEqual(["1.1.1", "1.4.3"]);
  });

  it("handles two-digit criteria (1.4.10 not 1.4.1)", () => {
    expect(criteriaFromTags(["wcag1410"])).toEqual(["1.4.10"]);
  });

  it("ignores non-criterion tags (levels, best-practice)", () => {
    expect(criteriaFromTags(["wcag2aa", "best-practice", "cat.color"])).toEqual([]);
  });

  it("dedupes", () => {
    expect(criteriaFromTags(["wcag111", "wcag111"])).toEqual(["1.1.1"]);
  });
});
