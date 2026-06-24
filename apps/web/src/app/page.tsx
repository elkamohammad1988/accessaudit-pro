import Link from "next/link";
import { PLAN_LIMITS, PLAN_TIERS, formatLimit } from "@accessaudit/shared";

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
            Scan any site, get a prioritized WCAG report, and hand over a white-labeled deliverable —
            built for agencies, not just developers.
          </p>
        </div>
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
      </section>

      {/* Features */}
      <section aria-label="Features" className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-lg border p-6">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section aria-label="Pricing" className="space-y-6 border-t py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Simple, agency-friendly pricing</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Start free, no card required. Upgrade when you need more.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => {
            const p = PLAN_LIMITS[tier];
            return (
              <div key={tier} className="flex flex-col rounded-lg border p-5">
                <p className="font-semibold">{p.label}</p>
                <p className="mt-1 text-2xl font-bold">
                  ${p.priceMonthly}
                  <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">/mo</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <li>{formatLimit(p.clients)} clients</li>
                  <li>{formatLimit(p.projects)} projects</li>
                  <li>{formatLimit(p.scansPerMonth)} scans/mo</li>
                  <li>{formatLimit(p.pagesPerScan)} pages/scan</li>
                  <li>{p.whiteLabelPdf ? "White-label PDF" : "Public links only"}</li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  {p.priceMonthly === 0 ? "Get started" : `Choose ${p.label}`}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
          Automated scanning catches ~30–50% of WCAG issues. Every report flags where manual review
          is still required — protecting you and your clients. Workspaces are single-user in this
          release; team seats are on the roadmap.
        </p>
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
