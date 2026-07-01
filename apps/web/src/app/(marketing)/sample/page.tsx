import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ReportView } from "@/components/scans/report-view";
import { SAMPLE_BRAND, SAMPLE_REPORT } from "@/lib/sample-report";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.sample");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/sample" },
  };
}

export default async function SampleReportPage() {
  const t = await getTranslations("marketing.sample");

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Conversion banner */}
      <div className="flex flex-col gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">{t("bannerStrong")}</span> {t("bannerRest")}
        </p>
        <ButtonLink href="/signup" size="sm" className="h-9 shrink-0">
          {t("bannerCta")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>

      {/* Branded report (mirrors the public /r/[token] deliverable) */}
      <div className="mt-6">
        <div
          className="h-1.5 w-full rounded-full"
          style={{ backgroundColor: SAMPLE_BRAND.brandColor }}
        />

        <header className="mt-5 flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: SAMPLE_BRAND.brandColor }}
          >
            NS
          </div>
          <div>
            <p className="text-lg font-semibold">{SAMPLE_BRAND.agencyName}</p>
            <p className="text-sm text-muted-foreground">
              {SAMPLE_BRAND.clientName} · WCAG {SAMPLE_REPORT.wcagLevel} · {SAMPLE_BRAND.date}
            </p>
          </div>
        </header>

        <h1 className="mt-6 text-2xl font-semibold">{t("reportTitle")}</h1>

        <div className="mt-5">
          <ReportView {...SAMPLE_REPORT} />
        </div>

        <footer className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          {t("poweredBy")}
        </footer>
      </div>

      {/* Closing CTA */}
      <div className="mt-8 rounded-2xl border bg-muted/30 px-6 py-10 text-center">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("ctaHeading")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{t("ctaBody")}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/signup" size="lg">
            {t("ctaPrimary")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/pricing" size="lg" variant="secondary">
            {t("ctaSecondary")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
