"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { appBaseUrl } from "@/lib/env";
import type { BillingInterval } from "@accessaudit/shared";
import { getStripe, priceIdForPlan } from "@/lib/stripe";

const planSchema = z.enum(["starter", "agency", "scale"]);

/** Start a Stripe Checkout session for the chosen plan, then redirect to it. */
export async function startCheckout(formData: FormData): Promise<void> {
  const parsed = planSchema.safeParse(formData.get("plan"));
  if (!parsed.success) {
    redirect("/settings/billing?status=error");
  }
  const plan = parsed.data;
  // Anything other than an explicit "yearly" defaults to monthly (safe fallback).
  const interval: BillingInterval = formData.get("interval") === "yearly" ? "yearly" : "monthly";

  const { organization } = await requireOrg();
  const admin = createAdminClient();

  let destination = "/settings/billing?status=error";
  try {
    const stripe = getStripe();

    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organization.id)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: organization.name,
        metadata: { organization_id: organization.id },
      });
      customerId = customer.id;
      // subscriptions is service-role-write only — use the admin client.
      await admin
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("organization_id", organization.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdForPlan(plan, interval), quantity: 1 }],
      client_reference_id: organization.id,
      metadata: { organization_id: organization.id },
      subscription_data: { metadata: { organization_id: organization.id } },
      success_url: `${appBaseUrl()}/settings/billing?status=success`,
      cancel_url: `${appBaseUrl()}/settings/billing?status=cancel`,
      allow_promotion_codes: true,
    });

    if (session.url) destination = session.url;
  } catch (err) {
    console.error("startCheckout failed:", err);
  }

  // destination may be an external Stripe URL — opt out of typed-route checking.
  redirect(destination as Parameters<typeof redirect>[0]);
}

/** Open the Stripe Customer Portal for plan changes, invoices, payment methods. */
export async function openPortal(): Promise<void> {
  const { organization } = await requireOrg();
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organization.id)
    .maybeSingle();

  // No customer yet (never checked out) — nothing to manage.
  if (!sub?.stripe_customer_id) {
    redirect("/settings/billing?status=no-customer");
  }
  const customerId = sub.stripe_customer_id;

  let destination = "/settings/billing?status=error";
  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appBaseUrl()}/settings/billing`,
    });
    destination = session.url;
  } catch (err) {
    console.error("openPortal failed:", err);
  }

  // destination may be an external Stripe URL — opt out of typed-route checking.
  redirect(destination as Parameters<typeof redirect>[0]);
}
