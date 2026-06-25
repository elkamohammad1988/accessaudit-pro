import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "How AccessAudit Pro holds its own product to the WCAG 2.2 AA standard it audits against — and how to report an accessibility issue.",
  alternates: { canonical: "/accessibility" },
};

const LAST_REVIEWED = "25 June 2026";
const CONTACT_EMAIL = "accessibility@accessaudit.pro";

export default function AccessibilityPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Accessibility Statement</h1>
      <p>Last reviewed {LAST_REVIEWED}</p>

      <p>
        We sell an accessibility product, so we hold our own to the same bar. AccessAudit Pro is
        built and tested to meet <strong>WCAG 2.2 Level AA</strong> — the standard our scans measure
        against. This statement explains where we stand and how to tell us if we fall short.
      </p>

      <h2>Conformance target</h2>
      <p>
        We aim for conformance with the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA
        across the AccessAudit Pro web application and marketing site. Accessibility is treated as a
        requirement during design and development, not an afterthought.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Semantic HTML with a logical heading structure and landmark regions.</li>
        <li>Full keyboard operability, with a visible focus indicator and no keyboard traps.</li>
        <li>Form fields with programmatic labels and clear, text-based error messages.</li>
        <li>Colour contrast that meets the AA thresholds, in both light and dark themes.</li>
        <li>Status messages (scan progress, errors) exposed to assistive technology.</li>
        <li>Content that reflows and remains usable at 200% zoom and on small screens.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        Accessibility is ongoing work. Some areas — for example, complex data tables in reports, or
        content rendered from a customer&rsquo;s own branding — may not yet fully meet every Level AA
        criterion. Where we find a gap, we prioritize and fix it. If you hit a barrier we haven&rsquo;t
        listed, please tell us.
      </p>

      <h2>Honesty about automated testing</h2>
      <p>
        Our own product, like any automated scanner, detects only part of all accessibility issues.
        We combine automated testing with manual review of our interface, and we recommend the same
        approach to our customers. A high automated score is a strong signal, not a guarantee of full
        conformance.
      </p>

      <h2>Give us feedback</h2>
      <p>
        If you encounter an accessibility barrier on AccessAudit Pro, email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Please include the page, what you
        were trying to do, and your browser and assistive technology if relevant. We aim to respond
        promptly and to fix confirmed issues as a priority.
      </p>
    </>
  );
}
