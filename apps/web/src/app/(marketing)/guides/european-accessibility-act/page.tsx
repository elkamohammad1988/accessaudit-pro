import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

const TITLE = "The European Accessibility Act: what web agencies need to know";
const DESCRIPTION =
  "A plain-language guide to the European Accessibility Act (EAA) for web agencies: who it covers, the June 2025 deadline, the EN 301 549 / WCAG 2.2 standard, and how to turn compliance into a service line.";
const PUBLISHED = "2026-06-25";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides/european-accessibility-act" },
  openGraph: { type: "article", title: TITLE, description: DESCRIPTION, url: "/guides/european-accessibility-act" },
};

// Reuse the legal pages' prose styling for long-form copy.
const PROSE =
  "mt-8 space-y-4 text-sm leading-relaxed [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[hsl(var(--foreground))] [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-[hsl(var(--foreground))] [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_p]:text-muted-foreground [&_li]:text-muted-foreground";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: PUBLISHED,
  author: { "@type": "Organization", name: "AccessAudit Pro" },
  publisher: { "@type": "Organization", name: "AccessAudit Pro" },
};

export default function EaaGuidePage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        // Structured data for search engines. Content is a fixed literal.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <p className="text-sm font-semibold uppercase tracking-wide text-brand">Guide</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
        {TITLE}
      </h1>

      <div className="mt-6 rounded-lg border bg-muted p-5 text-sm">
        <p className="font-medium text-[hsl(var(--foreground))]">In one minute</p>
        <p className="mt-1 text-muted-foreground">
          The European Accessibility Act (Directive (EU) 2019/882) has applied since{" "}
          <strong>28 June 2025</strong>. It requires many digital products and services sold to EU
          consumers — e-commerce, banking, e-books, transport, and more — to be accessible, measured
          against <strong>EN 301 549</strong>, which is built on <strong>WCAG</strong>. For agencies,
          that turns accessibility from a nice-to-have into a recurring, billable service.
        </p>
      </div>

      <div className={PROSE}>
        <h2>What the European Accessibility Act is</h2>
        <p>
          The European Accessibility Act (EAA) is{" "}
          <strong>Directive (EU) 2019/882</strong>, an EU-wide law that sets common accessibility
          requirements for a defined list of products and services. The goal is a single bar for
          accessibility across the EU, so a product or service that&rsquo;s accessible in one member
          state is accessible in all of them.
        </p>
        <p>
          It was adopted in 2019, and member states were required to apply their national measures
          from <strong>28 June 2025</strong>. That date has now passed — the requirements are live.
        </p>

        <h2>Who and what it covers</h2>
        <p>
          The EAA applies to businesses that place certain <strong>products</strong> on the EU market
          or provide certain <strong>services</strong> to EU consumers. The covered scope includes,
          among others:
        </p>
        <ul>
          <li>E-commerce (online shops and the websites/apps that sell to consumers)</li>
          <li>Consumer banking services and self-service terminals such as ATMs and payment terminals</li>
          <li>Electronic communications services and their access points</li>
          <li>Access to audiovisual media services (e.g. streaming platform interfaces)</li>
          <li>Elements of air, bus, rail, and waterborne passenger transport services</li>
          <li>E-books and dedicated reading software, and ticketing/check-in machines</li>
          <li>Consumer computing hardware, operating systems, smartphones, and TV equipment</li>
        </ul>
        <p>
          There is a notable carve-out: <strong>micro-enterprises that provide services</strong>{" "}
          (broadly, fewer than 10 people and under €2m turnover or balance-sheet total) are exempt
          from the service obligations — though the product rules and other laws may still apply.
          Scope and exemptions are detailed and fact-specific, so confirm a client&rsquo;s exact
          obligations before advising them.
        </p>

        <h2>The standard it points to: EN 301 549 and WCAG</h2>
        <p>
          The EAA itself states functional outcomes rather than line-by-line technical rules. In
          practice, conformity for websites and apps is demonstrated against the EU&rsquo;s
          harmonised standard, <strong>EN 301 549</strong>, whose web requirements are built directly
          on the <strong>Web Content Accessibility Guidelines (WCAG)</strong> at Level AA. So when you
          audit a client&rsquo;s site against <strong>WCAG 2.2 AA</strong>, you are testing against the
          substance of what the EAA expects for the web.
        </p>

        <h2>What this means for agencies</h2>
        <p>
          Every agency client that sells to EU consumers — a shop, a booking flow, a banking portal —
          now has a concrete reason to care about accessibility, with a deadline already behind them.
          That&rsquo;s a recurring need, not a one-off:
        </p>
        <ul>
          <li>
            <strong>Audits</strong> — a clear, prioritized report of where a site falls short of WCAG
            2.2 AA, in language the client can act on.
          </li>
          <li>
            <strong>Remediation</strong> — fixing the issues, then re-auditing to show progress.
          </li>
          <li>
            <strong>Documentation</strong> — an accessibility statement and an evidence trail the
            client can point to.
          </li>
          <li>
            <strong>Monitoring</strong> — re-scanning over time so regressions don&rsquo;t creep back
            in after launch.
          </li>
        </ul>

        <h2>How to run an accessibility audit</h2>
        <ol>
          <li>
            <strong>Scope the site.</strong> Pick the key templates and journeys — home, a product or
            article page, the cart/checkout or contact form, the account area.
          </li>
          <li>
            <strong>Run an automated scan.</strong> Tools like axe-core render each page and flag the
            machine-detectable failures (contrast, missing labels, alt text, structure) fast.
          </li>
          <li>
            <strong>Prioritize by impact.</strong> Fix the critical and serious issues first — those
            are the ones that actually block users of assistive technology.
          </li>
          <li>
            <strong>Add manual review.</strong> Check the things automation can&rsquo;t: meaningful
            alt-text quality, keyboard operability, focus order, captions, and clear language.
          </li>
          <li>
            <strong>Report and re-test.</strong> Hand the client a readable report, fix, and re-scan
            to confirm the gaps are closed.
          </li>
        </ol>

        <h2>Where automated testing fits — and where it doesn&rsquo;t</h2>
        <p>
          Automated scanning is the fastest way to find the bulk of the clear, repeatable failures —
          but it only catches roughly <strong>30–50%</strong> of WCAG issues. A clean automated
          report is a strong start, not a certificate of compliance. The remaining issues need human
          judgement and assistive-technology testing. An honest deliverable says exactly which checks
          still need a person — it protects both you and your client.
        </p>
      </div>

      {/* CTA lives outside the prose wrapper so its button colors aren't overridden
          by the [&_a] descendant rule. */}
      <div className="relative mt-10 overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-card to-card px-6 py-10 text-center shadow-md">
        <div
          aria-hidden="true"
          className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_50%,black,transparent)]"
        />
        <div className="relative flex flex-col items-center gap-4">
          <p className="text-lg font-bold text-[hsl(var(--foreground))]">
            Run a WCAG 2.2 audit on a client site — free
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            See the prioritized, client-ready report AccessAudit Pro produces. No credit card.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup">Start free</ButtonLink>
            <ButtonLink href="/sample" variant="secondary">
              See a sample report
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className={PROSE}>
        <h2>A note on legal accuracy</h2>
        <p>
          This guide is general information for agencies, not legal advice. The EAA is implemented
          through national laws that differ by member state, and a client&rsquo;s exact obligations,
          exemptions, and deadlines depend on their products, services, and size. Encourage clients to
          confirm their position with qualified counsel.
        </p>
      </div>

      <p className="mt-10 border-t pt-6 text-xs text-muted-foreground">
        <Link href="/guides" className="text-brand underline-offset-4 hover:underline">
          ← All guides
        </Link>
      </p>
    </article>
  );
}
