import Link from "next/link";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  formatLimit,
  isUnlimited,
  type PlanTier,
} from "@accessaudit/shared";

// Signed-in visitors are redirected to /dashboard by middleware; this renders
// for signed-out visitors only.

const FEATURES = [
  {
    title: "Scan in seconds",
    body: "Enter a URL (or a list). A headless-Chromium + axe-core worker audits the rendered page against WCAG 2.2 and scores it.",
  },
  {
    title: "Reports clients can read",
    body: "Prioritized by impact, mapped to WCAG criteria, with plain-language fix guidance — not a wall of developer console output.",
  },
  {
    title: "White-label deliverables",
    body: "Share a branded public link or export a PDF with your logo and colors. Sell audits as a service line.",
  },
  {
    title: "Multi-client by design",
    body: "Organize work by client and project, re-scan over time, and keep every audit on record.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Add the site",
    body: "Create a client and project, then point AccessAudit at any public URL — or paste a list of pages.",
  },
  {
    n: "2",
    title: "Run the audit",
    body: "Our worker renders the page in real Chromium and runs axe-core against WCAG 2.2 AA. Watch progress live.",
  },
  {
    n: "3",
    title: "Deliver the report",
    body: "Hand the client a branded PDF or a shareable link — scored, prioritized, with fix guidance and manual-check notes.",
  },
];

const FAQS = [
  {
    q: "Does an automated scan make a site compliant?",
    a: "No tool can — and we say so on every report. Automated testing (we use axe-core, the same engine behind Lighthouse and axe DevTools) reliably catches the ~30–50% of WCAG issues that are machine-detectable. Each report lists exactly which criteria still need human review, so you set the right expectations and stay protected legally.",
  },
  {
    q: "Which standards do you check against?",
    a: "WCAG 2.2 Levels A & AA. Findings are mapped to the European Accessibility Act / EN 301 549 (our primary framing), plus ADA and Section 508 for US work — so one scan speaks to whichever obligation your client is under.",
  },
  {
    q: "Can I put my own brand on the reports?",
    a: "Yes, on any paid plan: your logo and brand color on white-label PDFs, plus the option to remove the \"Powered by AccessAudit\" mark on the Agency plan and up. Reports become a deliverable you can sell.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan needs no card — sign up and run your first scan in minutes. Upgrade only when you hit a limit.",
  },
  {
    q: "Is my clients' data safe?",
    a: "We only fetch publicly accessible pages, and we store HTML snippets of flagged elements only — never a full copy of the site. Every workspace is isolated at the database row level, so no one else can see your audits. Cancel anytime from the billing portal.",
  },
];

/** Marketing bullet list for a pricing card, derived from the plan's limits + flags. */
function planHighlights(tier: PlanTier): string[] {
  const p = PLAN_LIMITS[tier];
  const scans = isUnlimited(p.scansPerMonth)
    ? "Unlimited scans / month"
    : `${formatLimit(p.scansPerMonth)} scans / month`;
  const pages =
    p.pagesPerScan === 1 ? "Single-page scans" : `Up to ${formatLimit(p.pagesPerScan)} pages / scan`;
  const out = [
    `${formatLimit(p.clients)} ${p.clients === 1 ? "client" : "clients"}`,
    `${formatLimit(p.projects)} projects`,
    scans,
    pages,
  ];
  out.push(p.whiteLabelPdf ? "White-label PDF reports" : "AccessAudit-branded share links");
  if (p.dataExport) out.push("CSV / JSON export");
  if (p.removePoweredBy) out.push('Remove "Powered by" branding');
  if (p.priorityQueue) out.push("Priority scan queue");
  return out;
}

const POPULAR: PlanTier = "agency";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="flex flex-col items-center gap-8 py-20 text-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            WCAG 2.2 · EAA / EN 301 549
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Accessibility audits your clients can actually read.
          </h1>
          <p className="mx-auto max-w-xl text-[hsl(var(--muted-foreground))]">
            The European Accessibility Act is now in force. Scan any site, get a prioritized WCAG
            report, and hand over a white-labeled deliverable — built for agencies, not just
            developers.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
            <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            No credit card required · Free forever plan · Powered by axe-core
          </p>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-t py-16">
        <div className="text-center">
          <h2 id="how-heading" className="text-2xl font-bold">
            From URL to client-ready report in three steps
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            No setup, no browser extensions, no spreadsheets.
          </p>
        </div>
        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-lg border p-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section aria-label="Features" className="grid grid-cols-1 gap-4 border-t py-16 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-lg border p-6">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section aria-labelledby="pricing-heading" className="space-y-6 border-t py-16">
        <div className="text-center">
          <h2 id="pricing-heading" className="text-2xl font-bold">
            Simple, agency-friendly pricing
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Start free, no card required. Upgrade when you need more.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => {
            const p = PLAN_LIMITS[tier];
            const popular = tier === POPULAR;
            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-lg border p-5 ${
                  popular ? "border-brand ring-1 ring-brand" : ""
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-fg">
                    Most popular
                  </span>
                )}
                <p className="font-semibold">{p.label}</p>
                <p className="mt-1 text-2xl font-bold">
                  ${p.priceMonthly}
                  <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">
                    /mo
                  </span>
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                  {planHighlights(tier).map((line) => (
                    <li key={line} className="flex gap-2">
                      <span aria-hidden className="text-brand">
                        ✓
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-4 inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium ${
                    popular
                      ? "bg-brand text-brand-fg transition-opacity hover:opacity-90"
                      : "border hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  {p.priceMonthly === 0 ? "Get started" : `Choose ${p.label}`}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mx-auto max-w-2xl text-center text-xs text-[hsl(var(--muted-foreground))]">
          Automated scanning catches ~30–50% of WCAG issues. Every report flags where manual review
          is still required — protecting you and your clients. Workspaces are single-user in this
          release; team seats are on the roadmap.
        </p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="border-t py-16">
        <div className="text-center">
          <h2 id="faq-heading" className="text-2xl font-bold">
            Questions agencies ask
          </h2>
        </div>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {FAQS.map((item) => (
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

      {/* Final CTA */}
      <section className="border-t py-16">
        <div className="flex flex-col items-center gap-5 rounded-xl border bg-[hsl(var(--muted))] px-6 py-12 text-center">
          <h2 className="text-2xl font-bold">Run your first audit today</h2>
          <p className="max-w-md text-sm text-[hsl(var(--muted-foreground))]">
            Turn accessibility compliance into a service line. Free to start — no card, no
            commitment.
          </p>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Start free
          </Link>
        </div>
      </section>

      <footer className="space-y-3 border-t py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <p>
          AccessAudit<span className="text-brand"> Pro</span> · WCAG 2.2 accessibility audits for
          agencies
        </p>
        <nav className="flex justify-center gap-4">
          <Link href="/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/login" className="underline-offset-4 hover:underline">
            Sign in
          </Link>
        </nav>
      </footer>
    </div>
  );
}
