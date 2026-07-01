import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FileText, Gauge, Layers, Palette, PlayCircle } from "lucide-react";
import { PLAN_LIMITS, PLAN_TIERS, isUnlimited, type PlanTier } from "@accessaudit/shared";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { getTranslations } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.landing");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/" },
    openGraph: {
      title: t("meta.ogTitle"),
      description: t("meta.ogDescription"),
      url: "/",
    },
  };
}

// Signed-in visitors are redirected to /dashboard by middleware; this renders
// for signed-out visitors only.

// Icons stay in code (locale-agnostic); their copy comes from the catalog,
// matched to the translated `features.items` array by position.
const FEATURE_ICONS = [Gauge, FileText, Palette, Layers] as const;

/** Marketing bullet list for a pricing card, derived from the plan's limits + flags. */
function planHighlights(tier: PlanTier, tp: Translator): string[] {
  const p = PLAN_LIMITS[tier];
  const clients = isUnlimited(p.clients)
    ? tp("highlights.clientsUnlimited")
    : p.clients === 1
      ? tp("highlights.clientsOne", { count: p.clients })
      : tp("highlights.clientsOther", { count: p.clients });
  const projects = isUnlimited(p.projects)
    ? tp("highlights.projectsUnlimited")
    : tp("highlights.projects", { count: p.projects });
  const scans = isUnlimited(p.scansPerMonth)
    ? tp("highlights.scansUnlimited")
    : tp("highlights.scansPerMonth", { count: p.scansPerMonth });
  const pages =
    p.pagesPerScan === 1
      ? tp("highlights.singlePageScans")
      : tp("highlights.pagesPerScan", { count: p.pagesPerScan });
  const out = [clients, projects, scans, pages];
  out.push(p.whiteLabelPdf ? tp("highlights.whiteLabelPdf") : tp("highlights.brandedLinks"));
  if (p.dataExport) out.push(tp("highlights.dataExport"));
  if (p.removePoweredBy) out.push(tp("highlights.removePoweredBy"));
  if (p.priorityQueue) out.push(tp("highlights.priorityQueue"));
  return out;
}

const POPULAR: PlanTier = "agency";

export default async function LandingPage() {
  const t = await getTranslations("marketing.landing");
  const tp = await getTranslations("plans");
  const tc = await getTranslations("common");

  const steps = t.raw("how.steps") as { title: string; body: string }[];
  const features = t.raw("features.items") as { title: string; body: string }[];
  const faqs = t.raw("faq.items") as { q: string; a: string }[];

  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="bg-spotlight relative flex flex-col items-center gap-6 py-16 text-center sm:py-20">
        <div className="space-y-5">
          <span className="inline-flex items-center rounded-full border border-brand/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            {t("hero.badge")}
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            {t("hero.titleLead")} <span className="text-brand">{t("hero.titleEmphasis")}</span>
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/sample" size="lg" variant="secondary">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              {t("hero.ctaSecondary")}
            </ButtonLink>
          </div>
          <p className="text-xs text-muted-foreground">{t("hero.reassurance")}</p>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-t py-12 sm:py-16">
        <div className="text-center">
          <h2 id="how-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("how.heading")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("how.subheading")}</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map((s, i) => {
            const n = String(i + 1);
            return (
              <Card key={n} interactive className="h-full p-5">
                {/* Domed, gold-rimmed step medallion — a lit numeral, not a flat dot. */}
                <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-brand-2 to-brand text-sm font-semibold text-brand-fg shadow-sm ring-1 ring-inset ring-white/20 dark:ring-gold/30">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"
                  />
                  <span className="relative">{n}</span>
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section aria-label={t("features.label")} className="border-t py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((f, i) => {
            const Icon = FEATURE_ICONS[i] ?? FEATURE_ICONS[0];
            return (
              <Card key={f.title} interactive className="group h-full p-5">
                {/* Alternating clay / gold enamel chips give the grid rhythm without
                    breaking the palette. */}
                <IconChip icon={Icon} tone={i % 2 === 0 ? "brand" : "gold"} size="md" glow />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section aria-labelledby="pricing-heading" className="space-y-6 border-t py-12 sm:py-16">
        <div className="text-center">
          <h2 id="pricing-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("pricing.heading")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("pricing.subheading")}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => {
            const p = PLAN_LIMITS[tier];
            const popular = tier === POPULAR;
            return (
              <Card
                key={tier}
                className={`relative flex h-full flex-col p-5 ${
                  popular ? "border-brand/50 shadow-md ring-1 ring-brand/25" : ""
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 start-5 inline-flex items-center rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-fg shadow-sm">
                    {t("pricing.mostPopular")}
                  </span>
                )}
                <p className="font-semibold">{p.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  ${p.priceMonthly}
                  <span className="text-sm font-normal text-muted-foreground">
                    {tc("units.perMonth")}
                  </span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {planHighlights(tier, tp).map((line) => (
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
                  {p.priceMonthly === 0
                    ? t("pricing.getStarted")
                    : t("pricing.choose", { plan: p.label })}
                </ButtonLink>
              </Card>
            );
          })}
        </div>
        <p className="text-center text-sm">
          <Link href="/pricing" className="font-medium text-brand underline-offset-4 hover:underline">
            {t("pricing.compare")}
          </Link>
        </p>
        <p className="mx-auto max-w-2xl text-center text-xs text-muted-foreground">
          {t("pricing.disclaimer")}
        </p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="border-t py-12 sm:py-16">
        <div className="text-center">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("faq.heading")}
          </h2>
        </div>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="group rounded-lg border bg-card p-5 transition-colors hover:border-foreground/15">
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

      {/* Final CTA */}
      <section className="border-t py-12 sm:py-16">
        <div className="lux-rim relative overflow-hidden rounded-2xl border bg-gradient-to-b from-brand/[0.07] to-transparent px-6 py-10 text-center dark:border-gold/15">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("cta.heading")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("cta.body")}
          </p>
          <div className="mt-5 flex justify-center">
            <ButtonLink href="/signup" size="lg">
              {t("cta.button")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
