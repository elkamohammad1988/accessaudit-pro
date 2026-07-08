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
  ShieldCheck,
} from "lucide-react";
import { PLAN_LIMITS, PLAN_TIERS, isUnlimited, type PlanTier } from "@accessaudit/shared";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { Reveal } from "@/components/ui/reveal";
import { Magnetic } from "@/components/ui/magnetic";
import { TiltCard } from "@/components/ui/tilt-card";
import { AssaySeal } from "@/components/marketing/assay-seal";
import { AuroraField } from "@/components/marketing/aurora-field";
import { getTranslations, getLocale } from "@/i18n/server";
import { isDemoMode } from "@/lib/env";
import { cn } from "@/lib/utils";
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

// The standards this one scan speaks to — proper nouns, so they're rendered
// verbatim (not translated) in the engraved ticker under the hero.
const STANDARDS = [
  "WCAG 2.2",
  "EN 301 549",
  "European Accessibility Act",
  "Section 508",
  "ADA Title III",
  "axe-core 4.10",
] as const;

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

/** A section eyebrow: a mono index + label with a short gold rule — the editorial
 *  running-head that gives each section a numbered rhythm. */
function Kicker({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
      <span className="text-gold-strong">{index}</span>
      <span className="h-px w-8 bg-gold/40" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default async function LandingPage() {
  const t = await getTranslations("marketing.landing");
  const tp = await getTranslations("plans");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const steps = t.raw("how.steps") as { title: string; body: string }[];
  const features = t.raw("features.items") as { title: string; body: string }[];
  const faqs = t.raw("faq.items") as { q: string; a: string }[];
  const stats = t.raw("stats") as { value: string; label: string }[];
  const rail = t.raw("rail") as { how: string; features: string; pricing: string; faq: string };

  // Local showcase: every "get started" CTA drops straight into the demo app
  // (no sign-up wall). With a real backend configured, they go to sign-up.
  const startHref = isDemoMode() ? "/dashboard" : "/signup";

  return (
    <div className="overflow-x-clip">
      {/* ── Hero — asymmetric: editorial copy left, machined assay seal right ─── */}
      <section className="relative isolate">
        <AuroraField anchor="right" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-12 lg:gap-8">
          {/* Copy column */}
          <div className="lg:col-span-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.04] px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-gold-strong">
                <span className="live-dot" aria-hidden="true" />
                {t("hero.badge")}
              </span>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="font-display mt-6 text-balance text-[2.6rem] font-semibold leading-[1.02] tracking-tight rtl:leading-[1.22] sm:text-6xl lg:text-[4.4rem]">
                {t("hero.titleLead")}{" "}
                <em className="text-gold-gradient not-italic sm:italic">
                  {t("hero.titleEmphasis")}
                </em>
              </h1>
            </Reveal>

            <Reveal delay={170}>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("hero.subtitle")}
              </p>
            </Reveal>

            <Reveal delay={250}>
              <div className="mt-8 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Magnetic>
                    <ButtonLink href={startHref} size="lg">
                      {t("hero.ctaPrimary")}
                      <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                    </ButtonLink>
                  </Magnetic>
                  <ButtonLink href="/sample" size="lg" variant="secondary">
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    {t("hero.ctaSecondary")}
                  </ButtonLink>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("hero.reassurance")}
                </p>
              </div>
            </Reveal>
          </div>

          {/* Seal column */}
          <div className="lg:col-span-5">
            <Reveal delay={220} className="mx-auto w-full max-w-[22rem]">
              <AssaySeal
                score={98}
                locale={locale}
                scoreLabel={t("seal.scoreLabel")}
                standard="WCAG 2.2 AA"
                ringText="CONFORMANCE ASSAY · ACCESSAUDIT PRO"
                ariaLabel={t("seal.aria", { score: 98 })}
              />
            </Reveal>
          </div>
        </div>

        {/* Engraved standards ticker */}
        <div className="relative border-y border-border/70 bg-card/40 py-4">
          <p className="sr-only">{t("trust")}</p>
          <div className="marquee-mask overflow-hidden">
            <div className="flex w-max animate-marquee items-center gap-10 pe-10 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {[...STANDARDS, ...STANDARDS, ...STANDARDS, ...STANDARDS].map((s, i) => (
                <span key={i} className="flex items-center gap-10">
                  <span className="inline-block h-1 w-1 rotate-45 bg-gold/60" aria-hidden="true" />
                  <span className="whitespace-nowrap">{s}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band — oversized display numerals, off-grid rules ──────────── */}
      <section aria-label={t("trust")} className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {stats.map((s, i) => (
            <Reveal
              key={s.value}
              delay={i * 100}
              className="border-gold/25 ps-5 sm:border-s"
            >
              <p className="font-display text-5xl font-semibold tracking-tight text-gold-gradient sm:text-6xl">
                {s.value}
              </p>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works — editorial numbered rhythm, not even boxes ─────────── */}
      <section aria-labelledby="how-heading" className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <Reveal className="max-w-2xl">
          <Kicker index="01" label={rail.how} />
          <h2
            id="how-heading"
            className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {t("how.heading")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("how.subheading")}</p>
        </Reveal>

        {/* A guided vertical timeline: one continuous rail threads three stations, each
            a node seated beside a large editorial numeral. Reads as a single journey
            (URL → report) rather than three loose rows. The rail is vertical only, so
            it stays RTL-safe. */}
        <ol className="relative mt-12 space-y-9 sm:mt-14 sm:space-y-11">
          <span
            aria-hidden="true"
            className="absolute start-[0.9375rem] top-4 bottom-6 w-px bg-gradient-to-b from-gold/10 via-gold/45 to-gold/5"
          />
          {steps.map((s, i) => {
            const n = String(i + 1).padStart(2, "0");
            return (
              <Reveal
                as="li"
                key={s.title}
                delay={i * 110}
                className="group relative grid grid-cols-[1.875rem_1fr] items-start gap-x-4 gap-y-1 sm:grid-cols-[1.875rem_auto_1fr] sm:gap-x-7"
              >
                {/* Station node — a lit bead on the rail; its bright border masks the
                    rail so the thread appears to connect station-to-station. */}
                <span className="relative z-10 mt-1.5 flex justify-center">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-background bg-gradient-to-br from-gold-2 to-gold shadow-[0_0_0_4px_hsl(var(--gold)/0.12)] transition-transform duration-300 group-hover:scale-125" />
                </span>
                {/* Large editorial numeral — present (filled brass), not a faint ghost. */}
                <span
                  aria-hidden="true"
                  className="text-gold-gradient font-display hidden self-start text-5xl font-semibold leading-[0.8] tracking-tight sm:block lg:text-6xl"
                >
                  {n}
                </span>
                <div className="pt-0.5 sm:pt-1">
                  <h3 className="text-lg font-semibold sm:text-xl">{s.title}</h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </section>

      {/* ── Capabilities — asymmetric bento: one tall showcase + a stack ─────── */}
      <section aria-label={t("features.label")} className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <Reveal className="max-w-2xl">
          <Kicker index="02" label={rail.features} />
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {/* Showcase feature — a live tilting glass panel with a bespoke, product
              -relevant visual: the axe severity spectrum rendered as lit chips. */}
          <Reveal className="lg:col-span-2">
            <TiltCard className="flex h-full flex-col justify-between overflow-hidden p-6">
              <div>
                <IconChip icon={FEATURE_ICONS[0]} tone="gold" size="lg" glow />
                <h3 className="font-display mt-5 text-2xl font-semibold tracking-tight">
                  {features[0]?.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{features[0]?.body}</p>
              </div>
              <SeverityLegend className="mt-8" />
            </TiltCard>
          </Reveal>

          {/* Supporting capabilities — horizontal cards, alternating enamel. */}
          <div className="grid gap-4 lg:col-span-3">
            {features.slice(1).map((f, i) => {
              const Icon = FEATURE_ICONS[i + 1] ?? FEATURE_ICONS[0];
              return (
                <Reveal key={f.title} delay={i * 90}>
                  <Card interactive className="group flex h-full items-start gap-4 p-5">
                    <IconChip icon={Icon} tone={i % 2 === 0 ? "brand" : "gold"} size="md" glow />
                    <div>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {f.body}
                      </p>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing — the popular plan breaks the grid ──────────────────────── */}
      <section aria-labelledby="pricing-heading" className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <Reveal className="max-w-2xl">
          <Kicker index="03" label={rail.pricing} />
          <h2
            id="pricing-heading"
            className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {t("pricing.heading")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("pricing.subheading")}</p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
          {PLAN_TIERS.map((tier, i) => {
            const p = PLAN_LIMITS[tier];
            const popular = tier === POPULAR;
            return (
              <Reveal key={tier} delay={i * 80} className="h-full">
                <Card
                  className={cn(
                    "relative flex h-full flex-col p-6",
                    popular &&
                      "border-gold/50 shadow-lg ring-1 ring-gold/30 lg:-translate-y-3 lg:scale-[1.03]",
                  )}
                >
                  {popular && (
                    <span className="absolute -top-3 start-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-2 to-gold px-3 py-0.5 text-xs font-semibold text-gold-fg shadow-sm">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      {t("pricing.mostPopular")}
                    </span>
                  )}
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {p.label}
                  </p>
                  <p className="font-display mt-2 text-4xl font-semibold tracking-tight">
                    ${p.priceMonthly}
                    <span className="font-sans text-sm font-normal text-muted-foreground">
                      {tc("units.perMonth")}
                    </span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
                    {planHighlights(tier, tp).map((line) => (
                      <li key={line} className="flex items-start gap-2.5">
                        <Check
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            popular ? "text-gold-strong" : "text-brand",
                          )}
                          aria-hidden="true"
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href={startHref}
                    size="sm"
                    variant={popular ? "primary" : "secondary"}
                    className="mt-6"
                  >
                    {p.priceMonthly === 0
                      ? t("pricing.getStarted")
                      : t("pricing.choose", { plan: p.label })}
                  </ButtonLink>
                </Card>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link
            href="/pricing"
            className="font-medium text-brand underline-offset-4 hover:underline dark:text-gold-strong"
          >
            {t("pricing.compare")}
          </Link>
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground">
          {t("pricing.disclaimer")}
        </p>
      </section>

      {/* ── FAQ — editorial two-column: sticky heading + accordion ──────────── */}
      <section aria-labelledby="faq-heading" className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
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
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <Reveal>
                <Kicker index="04" label={rail.faq} />
                <h2
                  id="faq-heading"
                  className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                  {t("faq.heading")}
                </h2>
              </Reveal>
            </div>
          </div>
          <div className="space-y-3 lg:col-span-8">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="group rounded-xl border bg-card/60 p-5 transition-colors hover:border-foreground/15 dark:hover:border-gold/25">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — a large paper plate, edged in brass, with a seal echo ──── */}
      <section className="px-6 pb-20 pt-6">
        <Reveal>
          <div className="lux-rim relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-card/40 px-6 py-16 text-center dark:border-gold/15 sm:py-20">
            <AuroraField anchor="left" className="opacity-90" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                {t("cta.heading")}
              </h2>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
                {t("cta.body")}
              </p>
              <div className="mt-8 flex justify-center">
                <Magnetic>
                  <ButtonLink href={startHref} size="lg">
                    {t("cta.button")}
                    <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                  </ButtonLink>
                </Magnetic>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/** The axe accessibility-impact distribution as a miniature of the product's real
 *  output: graded severity bars rising from a debossed well over fine graduation
 *  lines — the machined-instrument language of the hero seal. Decorative. */
function SeverityLegend({ className }: { className?: string }) {
  // Heights are a plausible severity distribution (severe → minor), read as fractions
  // of the well so the bars stay proportioned at any size.
  const bars = [
    { key: "critical", cls: "bg-critical", h: 0.96 },
    { key: "serious", cls: "bg-serious", h: 0.72 },
    { key: "moderate", cls: "bg-moderate", h: 0.5 },
    { key: "minor", cls: "bg-minor", h: 0.34 },
  ] as const;
  return (
    <div aria-hidden="true" className={cn("space-y-2.5", className)}>
      <div className="deboss relative flex h-24 items-end gap-2 overflow-hidden rounded-2xl bg-muted/45 px-3.5 pb-3 pt-3 dark:bg-muted/30">
        {/* Graduation lines — the y-axis of a readout, so the bars sit on a scale. */}
        <div className="pointer-events-none absolute inset-x-3.5 inset-y-3 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-px w-full bg-border/70" />
          ))}
        </div>
        {bars.map((b) => (
          <span key={b.key} className="relative flex flex-1 items-end" style={{ height: "100%" }}>
            <span
              className={cn("relative block w-full rounded-t-[5px]", b.cls)}
              style={{ height: `${b.h * 100}%` }}
            >
              {/* Top gloss so each bar reads as a lit, domed solid, not a flat fill. */}
              <span className="absolute inset-x-0 top-0 h-1/3 rounded-t-[5px] bg-gradient-to-b from-white/45 to-transparent dark:from-white/15" />
            </span>
          </span>
        ))}
      </div>
      {/* Legend — severity colour keys as a row of dots (colour-only, so it stays
          language-agnostic; severity is never conveyed by hue alone elsewhere). */}
      <div className="flex items-center gap-2.5 ps-0.5">
        {bars.map((b) => (
          <span key={b.key} className={cn("h-1.5 w-1.5 rounded-full", b.cls)} />
        ))}
        <span className="ms-auto h-px w-10 bg-gradient-to-r from-gold/50 to-transparent rtl:bg-gradient-to-l" />
      </div>
    </div>
  );
}
