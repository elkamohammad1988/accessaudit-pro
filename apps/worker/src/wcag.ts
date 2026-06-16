import type { WcagLevel } from "@accessaudit/shared";

/**
 * axe-core tag sets per WCAG target level. Each higher level is a superset of
 * the lower ones (AA includes A; AAA includes AA). We include 2.0/2.1/2.2 tags
 * so a 2.2 AA scan also catches retained 2.0/2.1 criteria.
 */
const LEVEL_TAGS: Record<WcagLevel, string[]> = {
  A: ["wcag2a", "wcag21a", "wcag22a"],
  AA: ["wcag2a", "wcag21a", "wcag22a", "wcag2aa", "wcag21aa", "wcag22aa"],
  AAA: ["wcag2a", "wcag21a", "wcag22a", "wcag2aa", "wcag21aa", "wcag22aa", "wcag2aaa"],
};

export function tagsForLevel(level: WcagLevel): string[] {
  return LEVEL_TAGS[level];
}

/**
 * Convert axe success-criterion tags (e.g. "wcag111", "wcag1410") into dotted
 * WCAG criteria ("1.1.1", "1.4.10"). Non-criterion tags (level/best-practice)
 * are ignored. Principle and guideline are single digits; the criterion is 1–2.
 */
export function criteriaFromTags(tags: string[]): string[] {
  const out = new Set<string>();
  for (const tag of tags) {
    const match = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag);
    if (match) {
      out.add(`${match[1]}.${match[2]}.${Number(match[3])}`);
    }
  }
  return [...out];
}
