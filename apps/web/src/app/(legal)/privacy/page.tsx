import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AccessAudit Pro collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

// Fixed publication date; bump on change.
// NOTE FOR THE OPERATOR: confirm and substitute your registered trading entity.
const EFFECTIVE_DATE = "28 June 2026";
const COMPANY = "AccessAudit Pro";
const CONTACT_EMAIL = "privacy@accessaudit.pro";

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Privacy Policy</h1>
      <p>Effective {EFFECTIVE_DATE}</p>

      <p>
        This Privacy Policy explains how {COMPANY} (&ldquo;AccessAudit Pro&rdquo;, &ldquo;we&rdquo;)
        collects, uses, and protects information in connection with the AccessAudit Pro service (the
        &ldquo;Service&rdquo;). We act as the data controller for account data and as your processor
        for the audit data you submit.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> your email address, password (stored only as a salted
          hash by our authentication provider), and the organization/brand details you enter.
        </li>
        <li>
          <strong>Audit data:</strong> the URLs you submit, the clients and projects you create, and
          the accessibility results we generate (scores, violations, and limited HTML snippets of the
          elements that failed a rule). We do not log into target sites or collect personal data from
          scanned pages beyond what is necessary to report a violation.
        </li>
        <li>
          <strong>Billing information:</strong> processed by Stripe. We store a Stripe customer and
          subscription identifier and your plan status; we do not store full card numbers.
        </li>
        <li>
          <strong>Technical and diagnostic data:</strong> standard server logs and, where enabled,
          error-monitoring events used to keep the Service reliable and secure.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>to provide, operate, and improve the Service and generate your reports;</li>
        <li>to process payments, manage subscriptions, and enforce plan limits;</li>
        <li>to secure the Service, prevent abuse, and diagnose and fix errors;</li>
        <li>to communicate with you about your account and service-related matters;</li>
        <li>to comply with legal obligations.</li>
      </ul>
      <p>
        We do not sell your personal data, and we do not use your audit data to train models for
        other customers.
      </p>

      <h2>3. Sub-processors</h2>
      <p>We share data with service providers only as needed to run the Service:</p>
      <ul>
        <li>
          <strong>Supabase</strong> &mdash; authentication, database, and hosting of your account and
          audit data.
        </li>
        <li>
          <strong>Stripe</strong> &mdash; payment processing and subscription management.
        </li>
        <li>
          <strong>Error monitoring</strong> &mdash; aggregated diagnostic events, only when a
          monitoring key is configured.
        </li>
      </ul>

      <h2>4. Data retention</h2>
      <p>
        We retain account and audit data for as long as your account is active. You can delete
        individual scans, clients, and projects at any time; deletion removes the associated pages
        and violations. If you close your account, we delete or anonymize your data within a
        reasonable period, except where we must retain limited records to meet legal, tax, or
        security obligations.
      </p>

      <h2>5. Security</h2>
      <p>
        Data is encrypted in transit. Access to tenant data is restricted by database row-level
        security so each workspace can only reach its own records, and administrative database keys
        are used only by server-side processes. No method of transmission or storage is perfectly
        secure, but we take reasonable measures to protect your information.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, export, or delete your
        personal data, and to object to or restrict certain processing. You can exercise many of
        these directly in the app, or contact us using the details below. If you are in the EEA or
        UK, our legal bases for processing are performance of our contract with you, our legitimate
        interests in operating and securing the Service, and compliance with legal obligations.
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use only the cookies necessary to keep you signed in and to operate the Service. We do not
        use third-party advertising cookies.
      </p>

      <h2>8. International transfers</h2>
      <p>
        Your data may be processed in countries other than your own. Where required, we rely on
        appropriate safeguards for such transfers.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected by an updated
        effective date and, where appropriate, additional notice.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy questions or to exercise your rights, contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
