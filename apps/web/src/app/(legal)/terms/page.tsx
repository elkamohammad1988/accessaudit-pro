import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of AccessAudit Pro.",
  alternates: { canonical: "/terms" },
};

// Effective date is fixed (the date these terms were published), not the render
// date. Bump it whenever the terms change. The bracketed placeholders below must
// be filled with your real legal entity, jurisdiction, and contact before launch.
const EFFECTIVE_DATE = "24 June 2026";
const COMPANY = "[Company Legal Name]";
const JURISDICTION = "[Jurisdiction, e.g. England and Wales]";
const CONTACT_EMAIL = "legal@accessaudit.pro";

export default function TermsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Terms of Service</h1>
      <p>Effective {EFFECTIVE_DATE}</p>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) are a binding agreement between you (the
        &ldquo;Customer&rdquo;) and {COMPANY} (&ldquo;AccessAudit Pro&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;) governing your access to and use of the AccessAudit Pro website,
        application, and related services (together, the &ldquo;Service&rdquo;). By creating an
        account or using the Service, you agree to these Terms. If you do not agree, do not use the
        Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        AccessAudit Pro runs automated accessibility scans of web pages you specify, using
        headless-browser tooling and the axe-core rules engine, and produces reports mapped to the
        Web Content Accessibility Guidelines (WCAG) 2.2. The Service helps you find and prioritize
        many common accessibility issues; it does not perform manual or assistive-technology review.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You must provide accurate information, keep your credentials confidential, and are
        responsible for all activity under your account. You must be at least 18 years old and able
        to form a binding contract. You are responsible for your end users and clients.
      </p>

      <h2>3. Plans, billing and cancellation</h2>
      <ul>
        <li>
          Paid plans are billed monthly in advance through our payment processor, Stripe. By
          subscribing you authorize recurring charges until you cancel.
        </li>
        <li>
          Plan limits (clients, projects, scans per month, pages per scan, and features) are
          described on our pricing and billing pages and may change with notice.
        </li>
        <li>
          You can cancel at any time from the billing portal; cancellation takes effect at the end
          of the current billing period and you retain access until then.
        </li>
        <li>
          Except where required by law, payments are non-refundable and we do not provide refunds or
          credits for partial periods or unused scans. Fees are exclusive of taxes, which are your
          responsibility.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree that you will not, and will not permit anyone to:</p>
      <ul>
        <li>
          submit any URL for scanning unless you own the target site or have explicit authorization
          from its owner to audit it;
        </li>
        <li>
          use the Service to scan, probe, or test systems you are not authorized to assess, or in a
          way that violates any third party&rsquo;s rights or any applicable law;
        </li>
        <li>
          attempt to overload, disrupt, reverse-engineer, or gain unauthorized access to the
          Service or its infrastructure, or circumvent plan limits or usage controls;
        </li>
        <li>resell or provide the Service to third parties except as the intended audit deliverable.</li>
      </ul>
      <p>
        You are solely responsible for ensuring you have the right to scan any target you submit. We
        may suspend or terminate accounts that violate this section.
      </p>

      <h2>5. Accessibility disclaimer — please read</h2>
      <p>
        Automated testing detects only a portion of accessibility issues. Industry research and our
        own tooling indicate automated rules catch roughly 30&ndash;50% of WCAG issues. A clean or
        high-scoring report does <strong>not</strong> mean a site is fully accessible, compliant
        with WCAG, the European Accessibility Act, EN 301 549, the ADA, Section 508, or any other
        law or standard. Many requirements&mdash;such as the quality of alternative text, logical
        reading and focus order, keyboard operability, captions, and cognitive clarity&mdash;require
        human judgement and assistive-technology testing.
      </p>
      <p>
        Reports and scores are provided for informational purposes only, are not legal advice, and
        are not a certification of compliance. You are responsible for any remediation decisions and
        for obtaining independent expert and legal review where appropriate.
      </p>

      <h2>6. Your content and our intellectual property</h2>
      <p>
        You retain ownership of the data you submit and the reports generated for you, and you may
        share white-labeled deliverables with your clients. You grant us a limited license to
        process your data solely to provide the Service. We retain all rights in the Service
        software, models, and branding. Our honesty disclaimer must not be removed from reports.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        The Service relies on third-party providers including Supabase (hosting and database),
        Stripe (payments), and our error-monitoring provider. Your use may be subject to their
        terms. We are not responsible for third-party services we do not control.
      </p>

      <h2>8. Warranties</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
        warranties of any kind, whether express, implied, or statutory, including any implied
        warranties of merchantability, fitness for a particular purpose, accuracy, and
        non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or
        that scan results will be complete or accurate.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we will not be liable for any indirect, incidental,
        special, consequential, or punitive damages, or for any loss of profits, revenue, data, or
        goodwill, arising out of or relating to the Service. Our total aggregate liability for any
        claim relating to the Service will not exceed the amount you paid us in the twelve (12)
        months before the event giving rise to the claim.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You will indemnify and hold us harmless from any claim arising out of your use of the
        Service, your content, your scanning of any target, or your breach of these Terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access for breach of
        these Terms or for any unlawful or harmful use. On termination, your right to use the Service
        ends; sections that by their nature should survive will survive.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will be reflected by an updated
        effective date and, where appropriate, additional notice. Continued use after changes take
        effect constitutes acceptance.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of {JURISDICTION}, without regard to conflict-of-laws
        rules, and the courts of that jurisdiction will have exclusive jurisdiction, except where
        mandatory local law provides otherwise.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
