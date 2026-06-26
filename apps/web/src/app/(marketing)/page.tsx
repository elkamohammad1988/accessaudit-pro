import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  Gauge,
  Layers,
  Palette,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  formatLimit,
  isUnlimited,
  type PlanTier,
} from "@accessaudit/shared";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "WCAG accessibility audits & white-label reports for agencies",
  description:
    "Scan any site against WCAG 2.2, get a prioritized report mapped to the EAA / EN 301 549, and hand clients a white-label deliverable. Free to start — no card required.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AccessAudit Pro — WCAG audits your clients can actually read",
    description:
      "On-demand WCAG 2.2 accessibility audits and white-label reports for agencies. Free to start.",
    url: "/",
  },
};

// Signed-in visitors are redirected to /dashboard by middleware; this renders
// for signed-out visitors only.

const FEATURES = [
  {
    icon: Gauge,
    title: "Scan in seconds",
    body: "Enter a URL (or a list). A headless-Chromium + axe-core worker audits the rendered page against WCAG 2.2 and scores it.",
  },
  {
    icon: FileText,
    title: "Reports clients can read",
    body: "Prioritized by impact, mapped to WCAG criteria, with plain-language fix guidance — not a wall of developer console output.",
  },
  {
    icon: Palette,
    title: "White-label deliverables",
    body: "Share a branded public link or export a PDF with your logo and colors. Sell audits as a service line.",
  },
  {
    icon: Layers,
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
      <section className="bg-spotlight relative flex flex-col items-center gap-8 py-20 text-center sm:py-28">
        {/* Ambient brand glow + faint dot grid behind the hero for depth. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-10 -z-10 mx-auto h-72 w-full max-w-3xl rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_30%,black,transparent)]"
        />
        <Reveal className="space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand shadow-xs">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            WCAG 2.2 · EAA / EN 301 549
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Accessibility audits your clients can{" "}
            <span className="text-gradient-brand">actually read.</span>
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            The European Accessibility Act is now in force. Scan any site, get a prioritized WCAG
            report, and hand over a white-labeled deliverable — built for agencies, not just
            developers.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/sample" size="lg" variant="secondary">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              See a sample report
            </ButtonLink>
          </div>
          <p className="text-xs text-muted-foreground">
            No credit card required · Free forever plan · Powered by axe-core
          </p>
        </Reveal>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-t py-16 sm:py-20">
        <Reveal className="text-center">
          <h2 id="how-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            From URL to client-ready report in three steps
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No setup, no browser extensions, no spreadsheets.
          </p>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <StaggerItem key={s.n}>
              <Card interactive className="h-full p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-sm font-semibold text-brand-fg shadow-sm ring-1 ring-inset ring-white/15">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Features */}
      <section aria-label="Features" className="border-t py-16 sm:py-20">
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <Card interactive className="h-full p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/15">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Pricing */}
      <section aria-labelledby="pricing-heading" className="space-y-8 border-t py-16 sm:py-20">
        <Reveal className="text-center">
          <h2 id="pricing-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Simple, agency-friendly pricing
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start free, no card required. Upgrade when you need more.
          </p>
        </Reveal>
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => {
            const p = PLAN_LIMITS[tier];
            const popular = tier === POPULAR;
            return (
              <StaggerItem key={tier} className="h-full">
                <Card
                  interactive
                  className={`relative flex h-full flex-col p-5 ${
                    popular ? "border-brand/60 shadow-lg ring-1 ring-brand/40" : ""
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-fg shadow-sm">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Most popular
                    </span>
                  )}
                  <p className="font-semibold">{p.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    ${p.priceMonthly}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                    {planHighlights(tier).map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href="/signup"
                    size="sm"
                    variant={popular ? "primary" : "secondary"}
                    className="mt-5"
                  >
                    {p.priceMonthly === 0 ? "Get started" : `Choose ${p.label}`}
                  </ButtonLink>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
        <p className="text-center text-sm">
          <Link href="/pricing" className="font-medium text-brand underline-offset-4 hover:underline">
            Compare all features →
          </Link>
        </p>
        <p className="mx-auto max-w-2xl text-center text-xs text-muted-foreground">
          Automated scanning catches ~30–50% of WCAG issues. Every report flags where manual review
          is still required — protecting you and your clients. Workspaces are single-user in this
          release; team seats are on the roadmap.
        </p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="border-t py-16 sm:py-20">
        <Reveal className="text-center">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Questions agencies ask
          </h2>
        </Reveal>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {FAQS.map((item) => (
            <details key={item.q} className="group rounded-lg border bg-card p-5 transition-colors hover:border-foreground/15">
              <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span
                    aria-hidden
                    className="text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t py-16 sm:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-card to-card px-6 py-14 text-center shadow-lg">
            <div
              aria-hidden="true"
              className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_50%,black,transparent)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-2/15 blur-3xl"
            />
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Run your first audit today
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                Turn accessibility compliance into a service line. Free to start — no card, no
                commitment.
              </p>
              <div className="mt-6 flex justify-center">
                <ButtonLink href="/signup" size="lg">
                  Start free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
