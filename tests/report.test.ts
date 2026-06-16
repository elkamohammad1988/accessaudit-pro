import { describe, it, expect } from "vitest";
import type { Violation } from "@accessaudit/database";
import { groupViolations, parseNodes } from "../apps/web/src/lib/report";

function violation(partial: Partial<Violation> & { scan_page_id: string; rule_id: string }): Violation {
  return {
    id: crypto.randomUUID(),
    organization_id: "org",
    impact: "minor",
    wcag_criteria: [],
    description: null,
    help_text: null,
    help_url: null,
    nodes: [],
    created_at: "2026-06-16T00:00:00Z",
    ...partial,
  } as Violation;
}

describe("parseNodes", () => {
  it("parses well-formed node arrays", () => {
    const nodes = parseNodes([
      { target: ["img.hero"], html: "<img>", failureSummary: "no alt" },
    ]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual({ target: ["img.hero"], html: "<img>", failureSummary: "no alt" });
  });

  it("is safe on non-arrays and junk", () => {
    expect(parseNodes(null)).toEqual([]);
    expect(parseNodes({ not: "an array" } as never)).toEqual([]);
    expect(parseNodes([42, "x"] as never)).toEqual([]);
  });
});

describe("groupViolations", () => {
  const pageUrlById = new Map([
    ["p1", "https://site/"],
    ["p2", "https://site/menu"],
  ]);

  it("collapses the same rule across pages into one group", () => {
    const groups = groupViolations(
      [
        violation({ scan_page_id: "p1", rule_id: "color-contrast", impact: "serious", wcag_criteria: ["1.4.3"], nodes: [{ target: ["a"], html: "<a>", failureSummary: "x" }] }),
        violation({ scan_page_id: "p2", rule_id: "color-contrast", impact: "serious", wcag_criteria: ["1.4.11"], nodes: [{ target: ["b"], html: "<b>", failureSummary: "y" }] }),
      ],
      pageUrlById,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].occurrences).toHaveLength(2);
    expect(groups[0].wcagCriteria.sort()).toEqual(["1.4.11", "1.4.3"]);
    expect(groups[0].nodeCount).toBe(2);
  });

  it("sorts by severity (critical before serious)", () => {
    const groups = groupViolations(
      [
        violation({ scan_page_id: "p1", rule_id: "color-contrast", impact: "serious" }),
        violation({ scan_page_id: "p1", rule_id: "image-alt", impact: "critical" }),
      ],
      pageUrlById,
    );
    expect(groups.map((g) => g.ruleId)).toEqual(["image-alt", "color-contrast"]);
  });
});
