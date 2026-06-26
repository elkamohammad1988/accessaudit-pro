import "server-only";

import Stripe from "stripe";

// Re-export the pure plan/price helpers so existing imports from "@/lib/stripe"
// keep working; the secret-bearing client below is the only server-only part.
export {
  PLAN_PRICE_ENV,
  priceIdForPlan,
  planForPriceId,
  mapStripeStatus,
} from "./stripe-plan";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}.`);
  return value;
}

/** Server-only Stripe client. Uses the SDK's pinned API version. */
export function getStripe(): Stripe {
  return new Stripe(required("STRIPE_SECRET_KEY"));
}
