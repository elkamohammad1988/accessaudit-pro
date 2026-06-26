import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { effectivePlan, limitsFor, type ScanStatus } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseTotals } from "@/lib/scan-format";
import { loadReportByScan } from "@/lib/load-report";
import { ReportView } from "@/components/scans/report-view";
import { PrintButton } from "@/components/scans/print-button";

export const metadata: Metadata = { title: "Report (print)" };

export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", organization.id)
    .maybeSingle();
  const limits = limitsFor(effectivePlan(sub?.plan, sub?.status));
  if (!limits.whiteLabelPdf) {
    redirect("/settings/billing");
  }

  const report = await loadReportByScan(supabase, scanId, organization.id);
  if (!report) notFound();

  const { scan } = report;
  const showPoweredBy = !limits.removePoweredBy;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <div className="no-print flex justify-end">
        <PrintButton />
      </div>

      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: organization.brand_color }} />

      <header className="flex items-center gap-4">
        {organization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={organization.logo_url} alt={`${organization.name} logo`} className="h-10 w-auto" />
        ) : null}
        <div>
          <p className="text-lg font-semibold">{organization.name}</p>
          <p className="text-sm text-muted-foreground">
            {report.clientName ? `${report.clientName} · ` : ""}
            WCAG {scan.wcag_level} · {new Date(scan.created_at).toLocaleDateString()}
          </p>
        </div>
      </header>

      <h1 className="text-2xl font-semibold">Accessibility audit</h1>

      <ReportView
        status={scan.status as ScanStatus}
        score={scan.score}
        totals={parseTotals(scan.totals)}
        wcagLevel={scan.wcag_level}
        pagesScanned={scan.pages_scanned}
        finishedAt={scan.finished_at}
        errorReason={scan.error_reason}
        pages={report.pages}
        groups={report.groups}
        expanded
      />

      {showPoweredBy ? (
        <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
          Powered by AccessAudit Pro
        </footer>
      ) : null}
    </div>
  );
}
