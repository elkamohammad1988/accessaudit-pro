import type { Metadata } from "next";
import Link from "next/link";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  formatLimit,
  type PlanLimits,
  type PlanTier,
} from "@accessaudit/shared";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Agency-friendly pricing for WCAG 2.2 accessibility audits. Start free, no card required. Compare Free, Starter, Agency and Scale plans.",
  alternates: { canonical: "/pricing" },
};

const POPULAR: PlanTier = "agency";

/** A single comparison row: a label and how to render each plan's cell. */
type Row = {
  label: string;
  cell: (p: PlanLimits) => { text: string } | { bool: boolean };
};

const ROWS: Row[] = [
  { label: "Clients", cell: (p) => ({ text: formatLimit(p.clients) }) },
  { label: "Projects", cell: (p) => ({ text: formatLimit(p.projects) }) },
  { label: "Scans / month", cell: (p) => ({ text: formatLimit(p.scansPerMonth) }) },
  { label: "Pages / scan", cell: (p) => ({ text: formatLimit(p.pagesPerScan) }) },
  { label: "Public shareable links", cell: () => ({ bool: true }) },
  { label: "White-label PDF reports", cell: (p) => ({ bool: p.whiteLabelPdf }) },
  { label: "CSV / JSON export", cell: (p) => ({ bool: p.dataExport }) },
  { label: 'Remove "Powered by" branding', cell: (p) => ({ bool: p.removePoweredBy }) },
  { label: "Priority scan queue", cell: (p) => ({ bool: p.priorityQueue }) },
];

const BILLING_FAQS = [
  {
    q: "Can I start without a credit card?",
    a: "Yes. The Free plan needs no card — sign up, create your workspace, and run your first scan in minutes.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Manage or cancel your subscription from the Stripe billing portal. Cancellation takes effect at the end of the current period; you keep access until then.",
  },
  {
    q: "What happens when I upgrade or downgrade?",
    a: "Upgrades take effect immediately and your new limits apply right away. Downgrades apply at the next billing period. Billing is prorated by Stripe.",
  },
  {
    q: "Do you offer refunds?",
    a: "Except where required by law, payments are non-refundable and we don't charge for unused scans — so the Free plan lets you evaluate the product fully before paying.",
  },
];

function Check() {
  return (
    <span className="text-brand">
      <span aria-hidden>✓</span>
      <span className="sr-only">Included</span>
    </span>
  );
}

function Dash() {
  return (
    <span className="text-[hsl(var(--muted-foreground))]">
      <span aria-hidden>—</span>
      <span className="sr-only">Not included</span>
    </span>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pricing that scales with your client list
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[hsl(var(--muted-foreground))]">
          Start free — no credit card. Move up when you take on more clients or need white-label
          deliverables. Cancel anytime.
        </p>
      </div>

      {/* Comparison table */}
      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Feature comparison across the Free, Starter, Agency, and Scale plans
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-[28%] px-3 py-3 text-left align-bottom">
                <span className="sr-only">Feature</span>
              </th>
              {PLAN_TIERS.map((tier) => {
                const p = PLAN_LIMITS[tier];
                const popular = tier === POPULAR;
                return (
                  <th
                    key={tier}
                    scope="col"
                    className={`px-3 py-3 text-center align-bottom ${
                      popular ? "rounded-t-lg bg-[hsl(var(--muted))]" : ""
                    }`}
                  >
                    <span className="block font-semibold">{p.label}</span>
                    <span className="mt-1 block text-lg font-bold">
                      ${p.priceMonthly}
                      <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                        /mo
                      </span>
                    </span>
                    {popular && (
                      <span className="mt-1 block text-xs font-medium text-brand">Most popular</span>
                    )}
                    <Link
                      href="/signup"
                      className={`mt-2 inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium ${
                        popular
                          ? "bg-brand text-brand-fg transition-opacity hover:opacity-90"
                          : "border hover:bg-[hsl(var(--muted))]"
                      }`}
                    >
                      {p.priceMonthly === 0 ? "Get started" : "Choose"}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t">
                <th scope="row" className="px-3 py-3 text-left font-normal">
                  {row.label}
                </th>
                {PLAN_TIERS.map((tier) => {
                  const result = row.cell(PLAN_LIMITS[tier]);
                  const popular = tier === POPULAR;
                  return (
                    <td
                      key={tier}
                      className={`px-3 py-3 text-center ${popular ? "bg-[hsl(var(--muted))]" : ""}`}
                    >
                      {"text" in result ? result.text : result.bool ? <Check /> : <Dash />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-[hsl(var(--muted-foreground))]">
        Automated scanning catches ~30–50% of WCAG issues. Every report flags where manual review is
        still required — protecting you and your clients. Workspaces are single-user in this release;
        team seats are on the roadmap.
      </p>

      {/* Billing FAQ */}
      <section aria-labelledby="billing-faq" className="mt-16 border-t pt-16">
        <h2 id="billing-faq" className="text-center text-2xl font-bold">
          Billing questions
        </h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {BILLING_FAQS.map((item) => (
            <details key={item.q} className="group rounded-lg border p-5">
              <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span
                    aria-hidden
                    className="text-[hsl(var(--muted-foreground))] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 border-t pt-16">
        <div className="flex flex-col items-center gap-5 rounded-xl border bg-[hsl(var(--muted))] px-6 py-12 text-center">
          <h2 className="text-2xl font-bold">Try it free — no card required</h2>
          <p className="max-w-md text-sm text-[hsl(var(--muted-foreground))]">
            Run a real WCAG audit and see the report your clients would get, before you pay a cent.
          </p>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Start free
          </Link>
        </div>
      </section>
    </div>
  );
}
