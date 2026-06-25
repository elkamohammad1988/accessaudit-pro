import type { Metadata } from "next";
import Link from "next/link";
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
      <div className="flex flex-col gap-3 rounded-lg border border-brand bg-[hsl(var(--muted))] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">This is a sample report.</span> It&rsquo;s exactly what
          your clients receive — run a real one on any site, free.
        </p>
        <Link
          href="/signup"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
        >
          Audit my site
        </Link>
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
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {SAMPLE_BRAND.clientName} · WCAG {SAMPLE_REPORT.wcagLevel} · {SAMPLE_BRAND.date}
            </p>
          </div>
        </header>

        <h1 className="mt-8 text-2xl font-semibold">Accessibility audit</h1>

        <div className="mt-6">
          <ReportView {...SAMPLE_REPORT} />
        </div>

        <footer className="mt-10 border-t pt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
          Powered by AccessAudit Pro
        </footer>
      </div>

      {/* Closing CTA */}
      <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border bg-[hsl(var(--muted))] px-6 py-10 text-center">
        <h2 className="text-xl font-bold">Generate a report like this for your client</h2>
        <p className="max-w-md text-sm text-[hsl(var(--muted-foreground))]">
          Free to start — no card. Add your logo and brand color, then export a PDF or share a link.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Start free
          </Link>
          <Link href="/pricing" className="text-sm font-medium underline-offset-4 hover:underline">
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
