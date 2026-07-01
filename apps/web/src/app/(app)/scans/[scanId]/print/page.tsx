import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { effectivePlan, limitsFor, type ScanStatus } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseTotals } from "@/lib/scan-format";
import { loadReportByScan } from "@/lib/load-report";
import { getTranslations, getLocale } from "@/i18n/server";
import { formatDateTime } from "@/lib/dates";
import { ReportView } from "@/components/scans/report-view";
import { PrintButton } from "@/components/scans/print-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scans.print");
  return { title: t("metaTitle") };
}

export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const { organization } = await requireSession();
  if (!organization) return null;

  const t = await getTranslations("scans");
  const locale = await getLocale();
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
    <div className="mx-auto max-w-3xl space-y-5 py-2">
      <div className="no-print flex justify-end">
        <PrintButton />
      </div>

      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: organization.brand_color }} />

      <header className="flex items-center gap-3">
        {organization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={organization.logo_url} alt={t("logoAlt", { name: organization.name })} className="h-10 w-auto" />
        ) : null}
        <div>
          <p className="text-lg font-semibold">{organization.name}</p>
          <p className="text-sm text-muted-foreground">
            {report.clientName ? `${report.clientName} · ` : ""}
            {t("wcagShort", { level: scan.wcag_level })} · {formatDateTime(scan.created_at, locale)}
          </p>
        </div>
      </header>

      <h1 className="text-2xl font-semibold">{t("auditHeading")}</h1>

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
          {t("poweredBy")}
        </footer>
      ) : null}
    </div>
  );
}
