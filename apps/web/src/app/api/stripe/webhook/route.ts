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
  const plan: PlanTier = deleted ? "free" : (planForPriceId(priceId) ?? "free");
  const status = deleted ? "canceled" : mapStripeStatus(subscription.status);
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const patch = {
    plan,
    status,
    stripe_subscription_id: subscription.id,
    current_period_end: currentPeriodEnd,
  };

  // Match by org id (from metadata) when available; otherwise by customer id.
  if (orgId) {
    await admin
      .from("subscriptions")
      .update({ ...patch, stripe_customer_id: customerId })
      .eq("organization_id", orgId);
  } else if (customerId) {
    await admin.from("subscriptions").update(patch).eq("stripe_customer_id", customerId);
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
          await admin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_customer_id", customerId);
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

  return new Response("ok", { status: 200 });
}
