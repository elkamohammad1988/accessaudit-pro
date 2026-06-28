import type Stripe from "stripe";
import type { BillingInterval, PlanTier } from "@accessaudit/shared";

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

/**
 * Paid tiers map to Stripe Prices via env, per billing interval. `free` has no
 * price. Configure the `_ANNUAL` vars to offer yearly billing; if they're unset,
 * annual checkout is simply not offered (the UI gates on `annualPricingConfigured`).
 */
export const PLAN_PRICE_ENV: Record<Exclude<PlanTier, "free">, Record<BillingInterval, string>> = {
  starter: { monthly: "STRIPE_PRICE_STARTER", yearly: "STRIPE_PRICE_STARTER_ANNUAL" },
  agency: { monthly: "STRIPE_PRICE_AGENCY", yearly: "STRIPE_PRICE_AGENCY_ANNUAL" },
  scale: { monthly: "STRIPE_PRICE_SCALE", yearly: "STRIPE_PRICE_SCALE_ANNUAL" },
};

export function priceIdForPlan(
  plan: Exclude<PlanTier, "free">,
  interval: BillingInterval = "monthly",
): string {
  return required(PLAN_PRICE_ENV[plan][interval]);
}

/** Reverse lookup used by the webhook — recognizes BOTH monthly and yearly prices. */
export function planForPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  for (const [plan, byInterval] of Object.entries(PLAN_PRICE_ENV)) {
    for (const envName of Object.values(byInterval)) {
      if (process.env[envName] === priceId) return plan as PlanTier;
    }
  }
  return null;
}

/** True only when every paid tier has an annual price configured. */
export function annualPricingConfigured(): boolean {
  return Object.values(PLAN_PRICE_ENV).every((byInterval) => Boolean(process.env[byInterval.yearly]));
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
