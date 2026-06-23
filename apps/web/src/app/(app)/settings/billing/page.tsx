import type { Metadata } from "next";
import Link from "next/link";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  effectivePlan,
  formatLimit,
  limitsFor,
  type PlanTier,
} from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthIso } from "@/lib/dates";
import { startCheckout, openPortal } from "./actions";

export const metadata: Metadata = { title: "Billing" };

const STATUS_BANNER: Record<string, { text: string; className: string }> = {
  success: {
    text: "Subscription updated. It can take a few seconds to reflect here.",
    className: "border-green-200 bg-green-50 text-green-800",
  },
  cancel: {
    text: "Checkout canceled — no changes were made.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  error: {
    text: "Something went wrong with billing. Please try again.",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  "no-customer": {
    text: "No billing account yet — pick a plan to get started.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [{ data: sub }, { count: scansThisMonth }, { count: clientsCount }, { count: projectsCount }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, stripe_subscription_id")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .gte("created_at", startOfMonthIso()),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .is("archived_at", null),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .is("archived_at", null),
    ]);

  // The subscription names a tier; `effectivePlan` is what's actually enforced
  // (an unpaid/canceled sub reverts to free limits). Show the real tier in the
  // header/plan grid, but size the usage meters by the enforced limits.
  const actualPlan: PlanTier = sub?.plan ?? "free";
  const plan = effectivePlan(sub?.plan, sub?.status);
  const actualLimits = limitsFor(actualPlan);
  const limits = limitsFor(plan);
  const hasPaid = actualPlan !== "free" && Boolean(sub?.stripe_subscription_id);
  const downgraded = plan !== actualPlan;
  const banner = status ? STATUS_BANNER[status] : undefined;

  const usage = [
    { label: "Scans this month", used: scansThisMonth ?? 0, limit: limits.scansPerMonth },
    { label: "Clients", used: clientsCount ?? 0, limit: limits.clients },
    { label: "Projects", used: projectsCount ?? 0, limit: limits.projects },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/settings"
          className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
        >
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {actualLimits.label} plan
          {hasPaid && sub?.status ? ` · ${sub.status}` : ""}
          {hasPaid && sub?.current_period_end
            ? ` · renews ${new Date(sub.current_period_end).toLocaleDateString()}`
            : ""}
        </p>
      </div>

      {downgraded ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Your {actualLimits.label} subscription is {sub?.status ?? "inactive"}, so{" "}
          {limits.label}-plan limits currently apply. Update your payment method in the billing
          portal to restore full access.
        </p>
      ) : null}

      {banner ? (
        <p role="status" className={`rounded-lg border p-3 text-sm ${banner.className}`}>
          {banner.text}
        </p>
      ) : null}

      <section aria-label="Usage" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {usage.map((u) => (
          <div key={u.label} className="rounded-lg border p-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{u.label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {u.used}
              <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">
                {" "}
                / {formatLimit(u.limit)}
              </span>
            </p>
          </div>
        ))}
      </section>

      {hasPaid ? (
        <section aria-label="Manage subscription" className="rounded-lg border p-6">
          <h2 className="text-lg font-medium">Manage subscription</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Change plan, update payment method, view invoices, or cancel.
          </p>
          <form action={openPortal} className="mt-4">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              Open billing portal
            </button>
          </form>
        </section>
      ) : null}

      <section aria-label="Plans" className="space-y-3">
        <h2 className="text-lg font-medium">Plans</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => {
            const p = PLAN_LIMITS[tier];
            const isCurrent = tier === actualPlan;
            return (
              <div
                key={tier}
                className={`flex flex-col rounded-lg border p-4 ${isCurrent ? "border-brand ring-1 ring-brand" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{p.label}</p>
                  {isCurrent ? (
                    <span className="rounded border border-brand px-2 py-0.5 text-xs font-medium text-brand">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  ${p.priceMonthly}
                  <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">/mo</span>
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <li>{formatLimit(p.clients)} clients</li>
                  <li>{formatLimit(p.projects)} projects</li>
                  <li>{formatLimit(p.scansPerMonth)} scans/mo</li>
                  <li>{formatLimit(p.pagesPerScan)} pages/scan</li>
                  <li>{p.whiteLabelPdf ? "White-label PDF" : "No white-label"}</li>
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Your plan</span>
                  ) : tier === "free" ? (
                    hasPaid ? (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        Downgrade via portal
                      </span>
                    ) : null
                  ) : hasPaid ? (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Switch via portal
                    </span>
                  ) : (
                    <form action={startCheckout}>
                      <input type="hidden" name="plan" value={tier} />
                      <button
                        type="submit"
                        className="inline-flex h-9 w-full items-center justify-center rounded-md bg-brand px-3 text-sm font-medium text-brand-fg hover:opacity-90"
                      >
                        Choose {p.label}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Limits are enforced as you create clients, projects, and scans. Prices billed monthly via
          Stripe. Workspaces are single-user in this release — team seats are on the roadmap.
        </p>
      </section>
    </div>
  );
}
