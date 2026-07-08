"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { appBaseUrl, isDemoMode } from "@/lib/env";
import { ENTITLED_STATUSES, type BillingInterval } from "@accessaudit/shared";
import { getStripe, priceIdForPlan } from "@/lib/stripe";

const planSchema = z.enum(["starter", "agency", "scale"]);

/** Start a Stripe Checkout session for the chosen plan, then redirect to it. */
export async function startCheckout(formData: FormData): Promise<void> {
  // Demo mode has no Stripe backend — surface an honest info banner rather than
  // letting getStripe() throw into the generic "something went wrong" error path.
  if (isDemoMode()) redirect("/settings/billing?status=demo");
  const parsed = planSchema.safeParse(formData.get("plan"));
  if (!parsed.success) {
    redirect("/settings/billing?status=error");
  }
  const plan = parsed.data;
  // Anything other than an explicit "yearly" defaults to monthly (safe fallback).
  const interval: BillingInterval = formData.get("interval") === "yearly" ? "yearly" : "monthly";

  const { organization } = await requireOrg();
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id, status, stripe_subscription_id")
    .eq("organization_id", organization.id)
    .maybeSingle();

  // Already on an active paid subscription — don't open a second checkout (Stripe
  // would create a duplicate subscription and double-bill). Send them back to
  // billing, where the "Manage subscription" portal button handles plan changes.
  // Kept OUTSIDE the try below so redirect()'s NEXT_REDIRECT signal isn't swallowed
  // by the catch.
  if (sub?.stripe_subscription_id && sub.status && ENTITLED_STATUSES.includes(sub.status)) {
    redirect("/settings/billing");
  }

  let destination = "/settings/billing?status=error";
  try {
    const stripe = getStripe();

    let customerId = sub?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          name: organization.name,
          metadata: { organization_id: organization.id },
        },
        // One Stripe customer per org: if two checkouts race, the idempotency key
        // makes Stripe return the SAME customer rather than orphaning a second one
        // (which would later trip the stripe_customer_id UNIQUE constraint).
        { idempotencyKey: `org-customer-${organization.id}` },
      );
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
  // Demo mode has no Stripe backend — surface an honest info banner rather than
  // letting getStripe() throw into the generic "something went wrong" error path.
  if (isDemoMode()) redirect("/settings/billing?status=demo");
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
