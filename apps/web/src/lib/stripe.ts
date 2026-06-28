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

/**
 * Stripe API version this code is written against. Pinned explicitly so a future
 * `pnpm update` of the SDK can't silently change the default API version (and the
 * shape of webhook payloads) underneath us. Bump deliberately, with testing.
 */
export const STRIPE_API_VERSION = "2024-12-18.acacia" as const;

/** Server-only Stripe client, pinned to an explicit API version. */
export function getStripe(): Stripe {
  return new Stripe(required("STRIPE_SECRET_KEY"), {
    apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  });
}
