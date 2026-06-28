import { IMPACT_LEVELS, type ImpactLevel, type ImpactTotals } from "@accessaudit/shared";
import { IMPACT_LABEL, totalViolations } from "@/lib/scan-format";

const SEGMENT_BG: Record<ImpactLevel, string> = {
  critical: "bg-critical",
  serious: "bg-serious",
  moderate: "bg-moderate",
  minor: "bg-minor",
};

const DOT_BG: Record<ImpactLevel, string> = SEGMENT_BG;

/** Stacked distribution of violations by impact, with a counted legend. */
export function SeverityBar({ totals }: { totals: ImpactTotals }) {
  const total = totalViolations(totals);
  // Convey the per-segment counts in the accessible name — color alone is not
  // perceivable, and the segment `title`s aren't read by assistive tech.
  const distributionLabel = IMPACT_LEVELS.filter((l) => totals[l] > 0)
    .map((l) => `${totals[l]} ${IMPACT_LABEL[l].toLowerCase()}`)
    .join(", ");

  if (total === 0) {
    return (
      <div
        role="img"
        aria-label="No violations found"
        className="flex h-2 w-full items-center overflow-hidden rounded-full bg-success/20"
      >
        <div className="h-full w-full bg-success/40" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex h-2 w-full origin-left animate-bar-grow overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Violation severity distribution: ${distributionLabel}`}
      >
        {IMPACT_LEVELS.map((level) =>
          totals[level] > 0 ? (
            <div
              key={level}
              className={SEGMENT_BG[level]}
              style={{ width: `${(totals[level] / total) * 100}%` }}
              title={`${totals[level]} ${IMPACT_LABEL[level].toLowerCase()}`}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {IMPACT_LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-1.5 text-xs">
            <span className={`h-2 w-2 rounded-full ${DOT_BG[level]}`} aria-hidden="true" />
            <span className="text-muted-foreground">{IMPACT_LABEL[level]}</span>
            <span className="font-semibold tabular-nums">{totals[level]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
