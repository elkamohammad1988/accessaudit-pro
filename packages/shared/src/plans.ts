/**
 * Plan limits — the single source of truth for what each tier allows.
 *
 * Per the architecture review (docs/DB_REVIEW.md §9), the MVP enforces limits in
 * app code (not a `plan_limits` table) and computes usage with COUNT(*) over
 * scans for the current billing period. Mirror PRD §8 when changing pricing.
 *
 * `UNLIMITED` is `Infinity`, so `count < limit` reads naturally for unbounded tiers.
 */

export const PLAN_TIERS = ["free", "starter", "agency", "scale"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const UNLIMITED = Number.POSITIVE_INFINITY;

export interface PlanLimits {
  /** Display name + monthly price (USD). priceMonthly 0 = free. */
  readonly label: string;
  readonly priceMonthly: number;
  /** Hard caps. UNLIMITED for unbounded tiers. */
  readonly clients: number;
  readonly projects: number;
  readonly scansPerMonth: number;
  readonly pagesPerScan: number;
  readonly teamSeats: number;
  /** Feature flags. */
  readonly whiteLabelPdf: boolean;
  readonly removePoweredBy: boolean;
  readonly dataExport: boolean;
  readonly priorityQueue: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    label: "Free",
    priceMonthly: 0,
    clients: 1,
    projects: 2,
    scansPerMonth: 10,
    pagesPerScan: 1,
    teamSeats: 1,
    whiteLabelPdf: false,
    removePoweredBy: false,
    dataExport: false,
    priorityQueue: false,
  },
  starter: {
    label: "Starter",
    priceMonthly: 29,
    clients: 5,
    projects: 25,
    scansPerMonth: 150,
    pagesPerScan: 25,
    teamSeats: 3,
    whiteLabelPdf: true,
    removePoweredBy: false,
    dataExport: true,
    priorityQueue: false,
  },
  agency: {
    label: "Agency",
    priceMonthly: 79,
    clients: UNLIMITED,
    projects: UNLIMITED,
    scansPerMonth: 750,
    pagesPerScan: 100,
    teamSeats: 10,
    whiteLabelPdf: true,
    removePoweredBy: true,
    dataExport: true,
    priorityQueue: true,
  },
  scale: {
    label: "Scale",
    priceMonthly: 199,
    clients: UNLIMITED,
    projects: UNLIMITED,
    scansPerMonth: 3000,
    pagesPerScan: 500,
    teamSeats: 25,
    whiteLabelPdf: true,
    removePoweredBy: true,
    dataExport: true,
    priorityQueue: true,
  },
};

export function limitsFor(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan];
}

/** Subscription lifecycle states, mirrored from the `subscription_status` enum. */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";

/**
 * Statuses that still entitle an org to its paid plan's limits. `past_due` is
 * deliberately included as a grace period: Stripe is still retrying the charge,
 * so we don't revoke access on the first failed payment. Anything else
 * (`canceled`, `incomplete`, or no/unknown status) reverts to free limits.
 */
export const ENTITLED_STATUSES: readonly string[] = ["active", "trialing", "past_due"];

/**
 * The plan whose limits actually apply right now. A paid `plan` only counts
 * while the subscription is in an entitled status — a canceled or incomplete
 * subscription is treated as free even though the row still names the paid tier
 * (the webhook keeps the price-derived plan until the subscription is deleted).
 * This is the single gate that prevents unpaid orgs from keeping paid limits.
 */
export function effectivePlan(
  plan: PlanTier | null | undefined,
  status: SubscriptionStatus | string | null | undefined,
): PlanTier {
  const tier = plan ?? "free";
  if (tier === "free") return "free";
  return status != null && ENTITLED_STATUSES.includes(status) ? tier : "free";
}

/** Numeric-limit keys you can gate a "create" action on. */
export type QuotaKey = "clients" | "projects" | "scansPerMonth" | "pagesPerScan" | "teamSeats";

/**
 * Would creating one more of `key` stay within the plan?
 * `currentCount` is the count BEFORE the new item.
 */
export function isWithinLimit(plan: PlanTier, key: QuotaKey, currentCount: number): boolean {
  return currentCount + 1 <= PLAN_LIMITS[plan][key];
}

/**
 * Is a scan of `pageCount` pages allowed on this plan? Unlike `isWithinLimit`
 * (which gates adding one more item), this compares the whole requested page count
 * against the per-scan cap.
 */
export function pagesWithinScanLimit(plan: PlanTier, pageCount: number): boolean {
  return pageCount <= PLAN_LIMITS[plan].pagesPerScan;
}

export function isUnlimited(value: number): boolean {
  return !Number.isFinite(value);
}

/** Human label for a limit value, e.g. for usage meters. */
export function formatLimit(value: number): string {
  return isUnlimited(value) ? "Unlimited" : String(value);
}
