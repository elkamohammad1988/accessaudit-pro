import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus, ShieldCheck } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

/** Included-feature mark — a lucide check tinted to the metal (gold in the
 *  highlighted column, brand elsewhere). The visible glyph is decorative; the
 *  cell's meaning is carried by the sr-only label for assistive tech. */
function CheckMark({ label, popular }: { label: string; popular?: boolean }) {
  return (
    <>
      <Check
        className={cn("mx-auto h-4 w-4", popular ? "text-gold-strong" : "text-brand")}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </>
  );
}

/** Not-included mark — a quiet minus so the "no" reads as absence, not a red X. */
function DashMark({ label }: { label: string }) {
  return (
    <>
      <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
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
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("heading")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          {t("subheading")}
        </p>
      </div>

      {/* EAA urgency — the active buying trigger for agencies serving EU clients. */}
      <div className="lux-rim mx-auto mt-8 max-w-2xl rounded-xl border border-brand/30 bg-brand/5 px-5 py-4 text-center text-sm dark:border-gold/20 dark:bg-gold/[0.04]">
        <p className="font-medium">{t("eaaTitle")}</p>
        <p className="mt-1 text-muted-foreground">
          {t("eaaBody")}{" "}
          <Link
            href="/guides/european-accessibility-act"
            className="font-medium text-brand underline-offset-4 hover:underline dark:text-gold-strong"
          >
            {t("eaaLink")}
          </Link>
          .
        </p>
      </div>

      {/* Comparison table */}
      <div className="mt-12 overflow-x-auto">
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
                    className={cn(
                      "px-3 py-4 text-center align-bottom",
                      popular &&
                        "rounded-t-xl bg-gold/[0.06] shadow-[inset_0_1px_0_0_hsl(var(--gold)/0.4)] dark:bg-gold/[0.05]",
                    )}
                  >
                    {popular ? (
                      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-gold-2 to-gold px-2.5 py-0.5 text-[11px] font-semibold text-gold-fg shadow-sm">
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                        {t("mostPopular")}
                      </span>
                    ) : null}
                    <span className="block font-semibold">{p.label}</span>
                    <span
                      className={cn(
                        "mt-1 block text-2xl font-bold tracking-tight tabular-nums",
                        popular && "text-gold-strong",
                      )}
                    >
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
                    <Link
                      href="/signup"
                      className={buttonVariants({
                        variant: popular ? "primary" : "secondary",
                        size: "sm",
                        className: "mt-3",
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
                  <th scope="row" className="px-3 py-3 text-start font-normal text-muted-foreground">
                    {row.label}
                  </th>
                  {PLAN_TIERS.map((tier) => {
                    const result = row.cell(PLAN_LIMITS[tier]);
                    const popular = tier === POPULAR;
                    return (
                      <td
                        key={tier}
                        className={cn(
                          "px-3 py-3 text-center tabular-nums",
                          popular && "bg-gold/[0.06] font-medium dark:bg-gold/[0.05]",
                          popular && last &&
                            "rounded-b-xl shadow-[inset_0_-1px_0_0_hsl(var(--gold)/0.3)]",
                        )}
                      >
                        {"text" in result ? (
                          result.text
                        ) : result.bool ? (
                          <CheckMark label={t("included")} popular={popular} />
                        ) : (
                          <DashMark label={t("notIncluded")} />
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

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
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
        <h2 id="billing-faq" className="font-display text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("faqHeading")}
        </h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border bg-card/60 p-5 transition-colors hover:border-foreground/15 dark:hover:border-gold/25"
            >
              <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-gold/30 text-gold-strong transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 border-t pt-16">
        <div className="lux-rim rounded-3xl border bg-card/40 px-6 py-12 text-center dark:border-gold/15">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("ctaHeading")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("ctaBody")}
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/signup" size="lg">
              {t("ctaButton")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
