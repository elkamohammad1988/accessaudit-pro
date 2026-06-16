import {
  EMPTY_TOTALS,
  IMPACT_LEVELS,
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

/** Tailwind classes for an impact badge. Order matches severity. */
export const IMPACT_BADGE: Record<ImpactLevel, string> = {
  critical: "border-red-300 bg-red-50 text-red-700",
  serious: "border-orange-300 bg-orange-50 text-orange-700",
  moderate: "border-amber-300 bg-amber-50 text-amber-800",
  minor: "border-slate-300 bg-slate-50 text-slate-700",
};

export interface StatusMeta {
  label: string;
  className: string;
  /** Terminal states won't change again — used to stop the realtime poller. */
  terminal: boolean;
}

export const STATUS_META: Record<ScanStatus, StatusMeta> = {
  queued: { label: "Queued", className: "border-slate-300 bg-slate-50 text-slate-700", terminal: false },
  running: { label: "Running", className: "border-blue-300 bg-blue-50 text-blue-700", terminal: false },
  completed: { label: "Completed", className: "border-green-300 bg-green-50 text-green-700", terminal: true },
  partial: { label: "Partial", className: "border-amber-300 bg-amber-50 text-amber-800", terminal: true },
  failed: { label: "Failed", className: "border-red-300 bg-red-50 text-red-700", terminal: true },
};

/** Color the numeric score by band (good / needs work / poor). */
export function scoreClassName(score: number | null): string {
  if (score === null) return "text-[hsl(var(--muted-foreground))]";
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
}
