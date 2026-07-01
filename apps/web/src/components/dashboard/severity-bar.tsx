"use client";

import { IMPACT_LEVELS, type ImpactLevel, type ImpactTotals } from "@accessaudit/shared";
import { totalViolations } from "@/lib/scan-format";
import { useTranslations } from "@/i18n/provider";

const SEGMENT_BG: Record<ImpactLevel, string> = {
  critical: "bg-critical",
  serious: "bg-serious",
  moderate: "bg-moderate",
  minor: "bg-minor",
};

const DOT_BG: Record<ImpactLevel, string> = SEGMENT_BG;

/** Stacked distribution of violations by impact, with a counted legend. */
export function SeverityBar({ totals }: { totals: ImpactTotals }) {
  const t = useTranslations("scans");
  const total = totalViolations(totals);
  // Convey the per-segment counts in the accessible name — color alone is not
  // perceivable, and the segment `title`s aren't read by assistive tech.
  const distributionLabel = IMPACT_LEVELS.filter((l) => totals[l] > 0)
    .map((l) => `${totals[l]} ${t("impact." + l).toLowerCase()}`)
    .join(", ");

  if (total === 0) {
    return (
      <div
        role="img"
        aria-label={t("severityBar.none")}
        className="flex h-2 w-full items-center overflow-hidden rounded-full bg-success/20"
      >
        <div className="h-full w-full bg-success/40" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={t("severityBar.distribution", { distribution: distributionLabel })}
      >
        {IMPACT_LEVELS.map((level) =>
          totals[level] > 0 ? (
            <div
              key={level}
              className={SEGMENT_BG[level]}
              style={{ width: `${(totals[level] / total) * 100}%` }}
              title={`${totals[level]} ${t("impact." + level).toLowerCase()}`}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {IMPACT_LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-1.5 text-xs">
            <span className={`h-2 w-2 rounded-full ${DOT_BG[level]}`} aria-hidden="true" />
            <span className="text-muted-foreground">{t("impact." + level)}</span>
            <span className="font-semibold tabular-nums">{totals[level]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
