import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ReportView } from "@/components/scans/report-view";
import { SAMPLE_BRAND, SAMPLE_REPORT } from "@/lib/sample-report";

export const metadata: Metadata = {
  title: "Sample accessibility report",
  description:
    "See exactly what an AccessAudit Pro report looks like — a scored, WCAG 2.2 audit with prioritized violations and fix guidance, ready to hand to a client.",
  alternates: { canonical: "/sample" },
};

export default function SampleReportPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Conversion banner */}
      <div className="flex flex-col gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">This is a sample report.</span> It&rsquo;s exactly what
          your clients receive — run a real one on any site, free.
        </p>
        <ButtonLink href="/signup" size="sm" className="h-9 shrink-0">
          Audit my site
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>

      {/* Branded report (mirrors the public /r/[token] deliverable) */}
      <div className="mt-8">
        <div
          className="h-1.5 w-full rounded-full"
          style={{ backgroundColor: SAMPLE_BRAND.brandColor }}
        />

        <header className="mt-6 flex items-center gap-4">
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

        <h1 className="mt-8 text-2xl font-semibold">Accessibility audit</h1>

        <div className="mt-6">
          <ReportView {...SAMPLE_REPORT} />
        </div>

        <footer className="mt-10 border-t pt-4 text-center text-xs text-muted-foreground">
          Powered by AccessAudit Pro
        </footer>
      </div>

      {/* Closing CTA */}
      <div className="relative mt-10 overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-card to-card px-6 py-12 text-center shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl"
        />
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Generate a report like this for your client
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Free to start — no card. Add your logo and brand color, then export a PDF or share a link.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/signup" size="lg">
            Start free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/pricing" size="lg" variant="secondary">
            See pricing
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
