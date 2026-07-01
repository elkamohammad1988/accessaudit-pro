import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@accessaudit/database";
import type { PlanTier } from "@accessaudit/shared";
import { getStripe, mapStripeStatus, planForPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AdminClient = SupabaseClient<Database>;

async function syncFromSubscription(
  admin: AdminClient,
  orgId: string | null,
  customerId: string | null,
  subscription: Stripe.Subscription,
  deleted = false,
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  let plan: PlanTier;
  if (deleted) {
    plan = "free";
  } else {
    const mapped = planForPriceId(priceId);
    if (!mapped && priceId) {
      // A real, paying subscription on a price we don't recognize means a
      // misconfigured environment (a missing STRIPE_PRICE_* var). Silently
      // mapping it to `free` would downgrade a paying customer with no signal —
      // throw instead so POST returns 500, Stripe keeps retrying, and the gap is
      // loud (and self-heals once the env var is set). The event is NOT recorded
      // as processed, so the retry re-runs it.
      throw new Error(`Unmapped Stripe price ${priceId} — set the STRIPE_PRICE_* env var for this plan.`);
    }
    plan = mapped ?? "free";
  }
  const status = deleted ? "canceled" : mapStripeStatus(subscription.status);
  // `current_period_end` is top-level on the API version we pin; read the
  // subscription-item fallback too so a future API-version move doesn't null it.
  const periodEndUnix =
    subscription.current_period_end ??
    (subscription.items.data[0] as { current_period_end?: number } | undefined)?.current_period_end ??
    null;
  const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;

  const patch = {
    plan,
    status,
    stripe_subscription_id: subscription.id,
    current_period_end: currentPeriodEnd,
  };

  // Match by org id (from metadata) when available; otherwise by customer id.
  // Throw on a DB error so POST returns 500 and Stripe retries — swallowing it
  // would ack the event (200) and leave the subscription row permanently stale.
  if (orgId) {
    // Trust boundary: never rebind a customer that already belongs to a DIFFERENT
    // org. Without this, divergent metadata (e.g. a portal/out-of-band customer)
    // could mis-attribute a subscription, or trip the stripe_customer_id UNIQUE
    // constraint and 500-loop the webhook forever.
    if (customerId) {
      const { data: existing } = await admin
        .from("subscriptions")
        .select("organization_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (existing && existing.organization_id !== orgId) {
        console.error(
          `Stripe customer ${customerId} is already bound to org ${existing.organization_id}; refusing to rebind to ${orgId}.`,
        );
        return; // non-retryable: ack the event, don't loop
      }
    }
    const { error } = await admin
      .from("subscriptions")
      .update({ ...patch, stripe_customer_id: customerId })
      .eq("organization_id", orgId);
    if (error) {
      // Unique-constraint conflict is a data condition, not a transient failure —
      // log and ack rather than 500-looping Stripe retries.
      if (error.code === "23505") {
        console.error(`Customer/subscription uniqueness conflict for org ${orgId}:`, error.message);
        return;
      }
      throw error;
    }
  } else if (customerId) {
    const { error } = await admin
      .from("subscriptions")
      .update(patch)
      .eq("stripe_customer_id", customerId);
    if (error) throw error;
  }
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return new Response("Missing signature or webhook secret.", { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return new Response("Invalid signature.", { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip an event we've already applied. We record the id only after
  // successful processing (below), so a handler that 500s leaves no row and Stripe's
  // retry reprocesses it. Subscription updates set absolute state, so even a rare
  // check-then-insert race double-applies harmlessly.
  const { data: seen } = await admin
    .from("stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (seen) {
    return new Response("ok (already processed)", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organization_id ?? session.client_reference_id ?? null;
        const customerId =
          typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null);
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncFromSubscription(admin, orgId, customerId, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organization_id ?? null;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await syncFromSubscription(
          admin,
          orgId,
          customerId,
          subscription,
          event.type === "customer.subscription.deleted",
        );
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? null);
        if (customerId) {
          const { error } = await admin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_customer_id", customerId);
          if (error) throw error;
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return new Response("Handler error.", { status: 500 });
  }

  // Mark processed so redeliveries are skipped. Best-effort: a failure here just
  // means a duplicate may reprocess later (handlers are idempotent), so don't 500.
  const { error: ledgerError } = await admin
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type });
  if (ledgerError && ledgerError.code !== "23505") {
    console.error("Failed to record stripe_event:", ledgerError);
  }

  return new Response("ok", { status: 200 });
}
