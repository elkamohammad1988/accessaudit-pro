import "server-only";

import Stripe from "stripe";
import type { PlanTier } from "@accessaudit/shared";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}.`);
  return value;
}

/** Server-only Stripe client. Uses the SDK's pinned API version. */
export function getStripe(): Stripe {
  return new Stripe(required("STRIPE_SECRET_KEY"));
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
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "incomplete";
  }
}
