import { describe, it, expect, beforeEach, afterEach } from "vitest";
// Pure plan/price logic lives in stripe-plan.ts (no server-only guard, no secrets).
import {
  annualPricingConfigured,
  mapStripeStatus,
  planForPriceId,
  priceIdForPlan,
} from "../apps/web/src/lib/stripe-plan";

describe("mapStripeStatus", () => {
  it("maps the entitled statuses through unchanged", () => {
    expect(mapStripeStatus("trialing")).toBe("trialing");
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("past_due")).toBe("past_due");
  });

  it("revokes on `unpaid` (Stripe exhausted retries) — bounded grace, not free access", () => {
    // The bug fix: `unpaid` used to map to past_due (kept paid limits forever).
    expect(mapStripeStatus("unpaid")).toBe("canceled");
  });

  it("maps canceled and treats unknown/incomplete states as incomplete", () => {
    expect(mapStripeStatus("canceled")).toBe("canceled");
    expect(mapStripeStatus("incomplete")).toBe("incomplete");
    expect(mapStripeStatus("incomplete_expired")).toBe("incomplete");
    expect(mapStripeStatus("paused")).toBe("incomplete");
  });
});

describe("planForPriceId", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.STRIPE_PRICE_STARTER = "price_starter_123";
    process.env.STRIPE_PRICE_AGENCY = "price_agency_456";
    process.env.STRIPE_PRICE_SCALE = "price_scale_789";
    process.env.STRIPE_PRICE_STARTER_ANNUAL = "price_starter_yr";
    process.env.STRIPE_PRICE_AGENCY_ANNUAL = "price_agency_yr";
    process.env.STRIPE_PRICE_SCALE_ANNUAL = "price_scale_yr";
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("resolves a configured monthly price id to its plan", () => {
    expect(planForPriceId("price_starter_123")).toBe("starter");
    expect(planForPriceId("price_agency_456")).toBe("agency");
    expect(planForPriceId("price_scale_789")).toBe("scale");
  });

  it("resolves ANNUAL price ids to the same plan (so yearly subs aren't mis-tiered)", () => {
    expect(planForPriceId("price_starter_yr")).toBe("starter");
    expect(planForPriceId("price_agency_yr")).toBe("agency");
    expect(planForPriceId("price_scale_yr")).toBe("scale");
  });

  it("returns null for an unknown or missing price id (no silent downgrade-to-paid)", () => {
    expect(planForPriceId("price_unknown")).toBeNull();
    expect(planForPriceId(null)).toBeNull();
    expect(planForPriceId(undefined)).toBeNull();
  });
});

describe("priceIdForPlan / annualPricingConfigured", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns the monthly id by default and the annual id when asked", () => {
    process.env.STRIPE_PRICE_AGENCY = "price_agency_456";
    process.env.STRIPE_PRICE_AGENCY_ANNUAL = "price_agency_yr";
    expect(priceIdForPlan("agency")).toBe("price_agency_456");
    expect(priceIdForPlan("agency", "monthly")).toBe("price_agency_456");
    expect(priceIdForPlan("agency", "yearly")).toBe("price_agency_yr");
  });

  it("reports annual availability only when ALL tiers have an annual price", () => {
    process.env.STRIPE_PRICE_STARTER_ANNUAL = "a";
    process.env.STRIPE_PRICE_AGENCY_ANNUAL = "b";
    delete process.env.STRIPE_PRICE_SCALE_ANNUAL;
    expect(annualPricingConfigured()).toBe(false);
    process.env.STRIPE_PRICE_SCALE_ANNUAL = "c";
    expect(annualPricingConfigured()).toBe(true);
  });
});
