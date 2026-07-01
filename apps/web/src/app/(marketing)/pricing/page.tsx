import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  PLAN_LIMITS,
  PLAN_TIERS,
  yearlySavings,
  type PlanLimits,
  type PlanTier,
} from "@accessaudit/shared";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { getTranslations } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.pricing");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/pricing" },
  };
}

const POPULAR: PlanTier = "agency";

/** A single comparison row: a label and how to render each plan's cell. */
type Row = {
  label: string;
  cell: (p: PlanLimits) => { text: string } | { bool: boolean };
};

function Check({ label }: { label: string }) {
  return (
    <span className="text-brand">
      <span aria-hidden>✓</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function Dash({ label }: { label: string }) {
  return (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default async function PricingPage() {
  const t = await getTranslations("marketing.pricing");
  const tp = await getTranslations("plans");
  const tc = await getTranslations("common");

  const rows: Row[] = [
    { label: tp("rows.clients"), cell: (p) => ({ text: displayLimit(p.clients, tp) }) },
    { label: tp("rows.projects"), cell: (p) => ({ text: displayLimit(p.projects, tp) }) },
    { label: tp("rows.scansPerMonth"), cell: (p) => ({ text: displayLimit(p.scansPerMonth, tp) }) },
    { label: tp("rows.pagesPerScan"), cell: (p) => ({ text: displayLimit(p.pagesPerScan, tp) }) },
    { label: tp("rows.publicLinks"), cell: () => ({ bool: true }) },
    { label: tp("rows.whiteLabelPdf"), cell: (p) => ({ bool: p.whiteLabelPdf }) },
    { label: tp("rows.dataExport"), cell: (p) => ({ bool: p.dataExport }) },
    { label: tp("rows.removePoweredBy"), cell: (p) => ({ bool: p.removePoweredBy }) },
    { label: tp("rows.priorityQueue"), cell: (p) => ({ bool: p.priorityQueue }) },
  ];

  const faqs = t.raw("faq") as { q: string; a: string }[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("heading")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("subheading")}</p>
      </div>

      {/* EAA urgency — the active buying trigger for agencies serving EU clients. */}
      <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-brand/30 bg-brand/5 px-5 py-4 text-center text-sm">
        <p className="font-medium">{t("eaaTitle")}</p>
        <p className="mt-1 text-muted-foreground">
          {t("eaaBody")}{" "}
          <Link href="/guides/european-accessibility-act" className="font-medium text-brand underline-offset-4 hover:underline">
            {t("eaaLink")}
          </Link>
          .
        </p>
      </div>

      {/* Comparison table */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">{t("tableCaption")}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[28%] px-3 py-3 text-start align-bottom">
                <span className="sr-only">{t("feature")}</span>
              </th>
              {PLAN_TIERS.map((tier) => {
                const p = PLAN_LIMITS[tier];
                const popular = tier === POPULAR;
                return (
                  <th
                    key={tier}
                    scope="col"
                    className={`px-3 py-3 text-center align-bottom ${
                      popular ? "rounded-t-lg bg-muted" : ""
                    }`}
                  >
                    <span className="block font-semibold">{p.label}</span>
                    <span className="mt-1 block text-lg font-bold">
                      ${p.priceMonthly}
                      <span className="text-xs font-normal text-muted-foreground">
                        {tc("units.perMonth")}
                      </span>
                    </span>
                    {p.priceMonthly > 0 ? (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {t("perYear", { yearly: p.priceYearly, savings: yearlySavings(tier) })}
                      </span>
                    ) : null}
                    {popular && (
                      <span className="mt-1 block text-xs font-medium text-brand">
                        {t("mostPopular")}
                      </span>
                    )}
                    <Link
                      href="/signup"
                      className={buttonVariants({
                        variant: popular ? "primary" : "secondary",
                        size: "sm",
                        className: "mt-2",
                      })}
                    >
                      {p.priceMonthly === 0 ? t("getStarted") : t("choose")}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const last = i === rows.length - 1;
              return (
                <tr key={row.label} className="border-t transition-colors hover:bg-muted/40">
                  <th scope="row" className="px-3 py-3 text-start font-normal">
                    {row.label}
                  </th>
                  {PLAN_TIERS.map((tier) => {
                    const result = row.cell(PLAN_LIMITS[tier]);
                    const popular = tier === POPULAR;
                    return (
                      <td
                        key={tier}
                        className={`px-3 py-3 text-center ${popular ? "bg-muted" : ""} ${
                          popular && last ? "rounded-b-lg" : ""
                        }`}
                      >
                        {"text" in result ? (
                          result.text
                        ) : result.bool ? (
                          <Check label={t("included")} />
                        ) : (
                          <Dash label={t("notIncluded")} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-5 max-w-2xl text-center text-xs text-muted-foreground">
        {t("disclaimer")}
      </p>

      {/* FAQ structured data → eligible for FAQ rich results in search. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      {/* Billing FAQ */}
      <section aria-labelledby="billing-faq" className="mt-12 border-t pt-16">
        <h2 id="billing-faq" className="text-center text-2xl font-bold">
          {t("faqHeading")}
        </h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border bg-card p-5 transition-colors hover:border-foreground/15"
            >
              <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
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

      {/* CTA */}
      <section className="mt-12 border-t pt-16">
        <div className="rounded-2xl border bg-muted/30 px-6 py-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("ctaHeading")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("ctaBody")}
          </p>
          <div className="mt-5 flex justify-center">
            <ButtonLink href="/signup" size="lg">
              {t("ctaButton")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
