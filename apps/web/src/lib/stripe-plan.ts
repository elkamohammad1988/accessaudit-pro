import type Stripe from "stripe";
import type { PlanTier } from "@accessaudit/shared";

/*
 * Pure Stripe plan/price mapping — no secrets, no SDK client. Kept separate from
 * lib/stripe.ts (which is `server-only` because it holds the secret-key client) so
 * this logic is unit-testable and importable without the server-only guard.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}.`);
  return value;
}

/** Paid tiers map to a Stripe Price via env. `free` has no price. */
export const PLAN_PRICE_ENV: Record<Exclude<PlanTier, "free">, string> = {
  starter: "STRIPE_PRICE_STARTER",
  agency: "STRIPE_PRICE_AGENCY",
  scale: "STRIPE_PRICE_SCALE",
};

export function priceIdForPlan(plan: Exclude<PlanTier, "free">): string {
  return required(PLAN_PRICE_ENV[plan]);
}

/** Reverse lookup used by the webhook to set the plan from a subscription's price. */
export function planForPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  for (const [plan, envName] of Object.entries(PLAN_PRICE_ENV)) {
    if (process.env[envName] === priceId) return plan as PlanTier;
  }
  return null;
}

/** Map a Stripe subscription status onto our subscription_status enum. */
export function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "trialing" | "active" | "past_due" | "canceled" | "incomplete" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      // Active dunning: Stripe is still retrying the charge. Bounded grace —
      // the org keeps its plan (see ENTITLED_STATUSES) until Stripe gives up.
      return "past_due";
    case "unpaid":
      // Stripe has exhausted retries and stopped — revoke to free, don't keep
      // granting paid limits indefinitely.
      return "canceled";
    case "canceled":
      return "canceled";
    default:
      return "incomplete";
  }
}
