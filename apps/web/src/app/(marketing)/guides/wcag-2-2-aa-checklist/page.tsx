import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

const TITLE = "WCAG 2.2 AA: a practical audit checklist for agencies";
const DESCRIPTION =
  "A plain-language WCAG 2.2 Level AA checklist for agencies — organized by the POUR principles, with the new 2.2 success criteria and a clear split of what an automated scan can and can't catch.";
const PUBLISHED = "2026-06-25";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides/wcag-2-2-aa-checklist" },
  openGraph: { type: "article", title: TITLE, description: DESCRIPTION, url: "/guides/wcag-2-2-aa-checklist" },
};

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

export default function WcagChecklistPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <p className="text-sm font-semibold uppercase tracking-wide text-brand">Guide</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
        {TITLE}
      </h1>

      <div className="mt-6 rounded-lg border bg-muted p-5 text-sm">
        <p className="font-medium text-[hsl(var(--foreground))]">In one minute</p>
        <p className="mt-1 text-muted-foreground">
          WCAG 2.2 Level AA is the bar most accessibility laws point to. Its requirements group under
          four principles — <strong>Perceivable, Operable, Understandable, Robust (POUR)</strong>.
          Use the checklist below as your audit pass. An automated scan clears the machine-checkable
          items fast; the rest need a human.
        </p>
      </div>

      <div className={PROSE}>
        <h2>What &ldquo;WCAG 2.2 AA&rdquo; actually means</h2>
        <p>
          The Web Content Accessibility Guidelines (WCAG) are organized into success criteria at three
          conformance levels: <strong>A</strong> (essential), <strong>AA</strong> (the standard most
          regulations require), and <strong>AAA</strong> (enhanced). For agency work, target{" "}
          <strong>Level AA</strong> — it covers A and AA criteria. Version 2.2 (the current
          recommendation) adds several new criteria on top of 2.1, mostly around focus, pointer
          targets, and authentication.
        </p>
        <p>
          Every criterion ladders up to one of the four POUR principles. Here&rsquo;s the working
          checklist.
        </p>

        <h2>Perceivable</h2>
        <ul>
          <li>
            <strong>Text alternatives (1.1.1)</strong> — every informative image has meaningful{" "}
            <code>alt</code> text; decorative images use empty <code>alt=&quot;&quot;</code>.
          </li>
          <li>
            <strong>Captions &amp; audio (1.2.x)</strong> — video has captions; audio-only content has
            a transcript.
          </li>
          <li>
            <strong>Info &amp; relationships (1.3.1)</strong> — structure (headings, lists, tables,
            form labels) is conveyed in markup, not just visually.
          </li>
          <li>
            <strong>Contrast (1.4.3)</strong> — text is at least 4.5:1 against its background (3:1 for
            large text); UI components and graphics meet 3:1 (1.4.11).
          </li>
          <li>
            <strong>Reflow &amp; resize (1.4.4, 1.4.10)</strong> — content works at 200% zoom and in a
            narrow viewport without horizontal scrolling or loss.
          </li>
        </ul>

        <h2>Operable</h2>
        <ul>
          <li>
            <strong>Keyboard (2.1.1, 2.1.2)</strong> — everything works with a keyboard alone, and
            focus is never trapped.
          </li>
          <li>
            <strong>Focus visible (2.4.7)</strong> — the focused element always has a clear visible
            indicator.
          </li>
          <li>
            <strong>Focus not obscured (2.4.11 — new in 2.2)</strong> — sticky headers/footers
            don&rsquo;t hide the focused element.
          </li>
          <li>
            <strong>Target size (2.5.8 — new in 2.2)</strong> — interactive targets are at least
            24×24 CSS pixels (or have adequate spacing).
          </li>
          <li>
            <strong>Dragging movements (2.5.7 — new in 2.2)</strong> — any drag action has a
            single-pointer alternative (e.g. tap).
          </li>
          <li>
            <strong>Bypass blocks &amp; titles (2.4.1, 2.4.2)</strong> — a skip link is present and
            each page has a unique, descriptive <code>&lt;title&gt;</code>.
          </li>
        </ul>

        <h2>Understandable</h2>
        <ul>
          <li>
            <strong>Language (3.1.1)</strong> — the page declares its language with{" "}
            <code>&lt;html lang&gt;</code>.
          </li>
          <li>
            <strong>Labels &amp; instructions (3.3.2)</strong> — every form field has a visible,
            programmatic label.
          </li>
          <li>
            <strong>Error identification &amp; suggestion (3.3.1, 3.3.3)</strong> — errors are named
            in text and, where possible, the fix is suggested.
          </li>
          <li>
            <strong>Consistent help (3.2.6 — new in 2.2)</strong> — help mechanisms appear in the same
            relative order across pages.
          </li>
          <li>
            <strong>Accessible authentication (3.3.8 — new in 2.2)</strong> — login doesn&rsquo;t rely
            on a cognitive test (like remembering or transcribing) with no alternative.
          </li>
          <li>
            <strong>Redundant entry (3.3.7 — new in 2.2)</strong> — don&rsquo;t make users re-enter
            information they already provided in the same process.
          </li>
        </ul>

        <h2>Robust</h2>
        <ul>
          <li>
            <strong>Parsing &amp; name/role/value (4.1.2)</strong> — custom controls expose a correct
            name, role, and state to assistive tech (correct ARIA, not broken ARIA).
          </li>
          <li>
            <strong>Status messages (4.1.3)</strong> — dynamic updates (e.g. &ldquo;3 results
            found&rdquo;, form errors) are announced without moving focus.
          </li>
        </ul>

        <h2>What an automated scan covers — and what it doesn&rsquo;t</h2>
        <p>
          A good automated tool (AccessAudit uses axe-core) reliably catches the machine-detectable
          subset — roughly <strong>30–50%</strong> of WCAG issues: missing alt attributes, low
          contrast, missing form labels, empty links/buttons, missing document language, ARIA misuse,
          and structural problems. That clears the bulk of the clear failures in seconds.
        </p>
        <p>
          The rest need a human: whether alt text is <em>meaningful</em>, whether reading and focus{" "}
          <em>order</em> make sense, whether the keyboard path is actually usable, caption quality,
          and cognitive clarity. The right workflow is to{" "}
          <strong>automate the clear failures, then review the judgement calls</strong> — and to say
          clearly in your report which is which.
        </p>
      </div>

      {/* CTA outside the prose wrapper (see note in the EAA guide). */}
      <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border bg-muted px-6 py-10 text-center">
        <p className="text-lg font-bold text-[hsl(var(--foreground))]">
          Clear the automatable half in seconds
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Run a free WCAG 2.2 AA scan and get a prioritized, client-ready report with fix guidance.
        </p>
        <div className="flex items-center gap-3">
          <ButtonLink href="/signup">Start free</ButtonLink>
          <Link href="/sample" className="text-sm font-medium underline-offset-4 hover:underline">
            See a sample report
          </Link>
        </div>
      </div>

      <div className={PROSE}>
        <h2>Keep this honest</h2>
        <p>
          No automated pass — and no single checklist — guarantees compliance. Use this as a working
          guide, automate what can be automated, document the manual checks, and bring in expert and
          legal review where the stakes call for it.
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
