import {
  EMPTY_TOTALS,
  IMPACT_LEVELS,
  scoreBand,
  type ImpactLevel,
  type ImpactTotals,
  type ScanStatus,
} from "@accessaudit/shared";
import type { Json } from "@accessaudit/database";

/** Safely coerce a jsonb `totals` value into a fully-populated ImpactTotals. */
export function parseTotals(value: Json | null | undefined): ImpactTotals {
  const totals: ImpactTotals = { ...EMPTY_TOTALS };
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const level of IMPACT_LEVELS) {
      const n = record[level];
      if (typeof n === "number") totals[level] = n;
    }
  }
  return totals;
}

export function totalViolations(totals: ImpactTotals): number {
  return totals.critical + totals.serious + totals.moderate + totals.minor;
}

export const IMPACT_LABEL: Record<ImpactLevel, string> = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor",
};

/**
 * Tailwind classes for an impact badge — soft tint + inset ring, theme-aware via
 * the severity tokens so they read correctly in both light and dark mode.
 */
export const IMPACT_BADGE: Record<ImpactLevel, string> = {
  critical: "bg-critical/10 text-critical ring-1 ring-inset ring-critical/25",
  serious: "bg-serious/10 text-serious ring-1 ring-inset ring-serious/25",
  moderate: "bg-moderate/10 text-moderate ring-1 ring-inset ring-moderate/25",
  minor: "bg-minor/10 text-minor ring-1 ring-inset ring-minor/25",
};

export interface StatusMeta {
  label: string;
  className: string;
  /** Terminal states won't change again — used to stop the realtime poller. */
  terminal: boolean;
}

export const STATUS_META: Record<ScanStatus, StatusMeta> = {
  queued: { label: "Queued", className: "bg-muted text-muted-foreground ring-1 ring-inset ring-border", terminal: false },
  running: { label: "Running", className: "bg-brand/10 text-brand ring-1 ring-inset ring-brand/25", terminal: false },
  completed: { label: "Completed", className: "bg-success/10 text-success ring-1 ring-inset ring-success/25", terminal: true },
  partial: { label: "Partial", className: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25", terminal: true },
  failed: { label: "Failed", className: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/25", terminal: true },
};

/** Color the numeric score by band (good / needs work / poor). */
export function scoreClassName(score: number | null): string {
  const { tone } = scoreBand(score);
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  if (tone === "danger") return "text-danger";
  return "text-muted-foreground";
}
