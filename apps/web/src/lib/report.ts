import { IMPACT_LEVELS, type ImpactLevel } from "@accessaudit/shared";
import type { Json, Violation } from "@accessaudit/database";

export interface ViolationNode {
  target: string[];
  html: string;
  failureSummary: string;
}

export interface GroupedViolation {
  ruleId: string;
  impact: ImpactLevel;
  wcagCriteria: string[];
  description: string | null;
  helpText: string | null;
  helpUrl: string | null;
  /** Affected elements, grouped by the page they were found on. */
  occurrences: { pageUrl: string; nodes: ViolationNode[] }[];
  nodeCount: number;
}

export function parseNodes(value: Json | null | undefined): ViolationNode[] {
  if (!Array.isArray(value)) return [];
  const nodes: ViolationNode[] = [];
  for (const item of value) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      const target = Array.isArray(record.target) ? record.target.map((t) => String(t)) : [];
      nodes.push({
        target,
        html: typeof record.html === "string" ? record.html : "",
        failureSummary: typeof record.failureSummary === "string" ? record.failureSummary : "",
      });
    }
  }
  return nodes;
}

const SEVERITY_RANK: Record<ImpactLevel, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

function isImpact(value: string): value is ImpactLevel {
  return (IMPACT_LEVELS as readonly string[]).includes(value);
}

/**
 * Collapse per-page violation rows into one group per axe rule, with their
 * affected nodes attached to the page where they occurred. Sorted by severity,
 * then by how many elements are affected.
 */
export function groupViolations(
  violations: Violation[],
  pageUrlById: Map<string, string>,
): GroupedViolation[] {
  const groups = new Map<string, GroupedViolation>();

  for (const v of violations) {
    const impact = isImpact(v.impact) ? v.impact : "minor";
    const nodes = parseNodes(v.nodes);
    const pageUrl = pageUrlById.get(v.scan_page_id) ?? "(unknown page)";

    let group = groups.get(v.rule_id);
    if (!group) {
      group = {
        ruleId: v.rule_id,
        impact,
        wcagCriteria: [],
        description: v.description,
        helpText: v.help_text,
        helpUrl: v.help_url,
        occurrences: [],
        nodeCount: 0,
      };
      groups.set(v.rule_id, group);
    }

    for (const criterion of v.wcag_criteria ?? []) {
      if (!group.wcagCriteria.includes(criterion)) group.wcagCriteria.push(criterion);
    }
    group.occurrences.push({ pageUrl, nodes });
    group.nodeCount += Math.max(nodes.length, 1);
  }

  return [...groups.values()].sort((a, b) => {
    const sev = SEVERITY_RANK[a.impact] - SEVERITY_RANK[b.impact];
    return sev !== 0 ? sev : b.nodeCount - a.nodeCount;
  });
}
