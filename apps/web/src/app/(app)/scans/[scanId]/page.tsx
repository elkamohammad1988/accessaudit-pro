import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, RotateCw, Table2, Trash2 } from "lucide-react";
import { effectivePlan, limitsFor, type ScanStatus } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { appBaseUrl } from "@/lib/env";
import { formatDateTime } from "@/lib/dates";
import { STATUS_META, parseTotals } from "@/lib/scan-format";
import { loadReportByScan } from "@/lib/load-report";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportView } from "@/components/scans/report-view";
import { ScanLive } from "@/components/scans/scan-live";
import { ScanStatusBadge } from "@/components/scans/scan-status-badge";
import { ShareControl } from "@/components/scans/share-control";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { rescanScan, deleteScan } from "../actions";

export const metadata: Metadata = { title: "Scan report" };

// Feedback for the redirect-only actions on this page (re-scan / delete / share).
const NOTICE: Record<string, string> = {
  "rate-limited": "You're starting scans too quickly. Wait a moment and try again.",
  "rescan-failed": "Couldn't start the re-scan. Please try again.",
  "delete-failed": "Couldn't delete this scan. Please try again.",
  "share-failed": "Couldn't update the share link. Please try again.",
};

export default async function ScanReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ scanId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { scanId } = await params;
  const { notice } = await searchParams;
  const noticeMessage = notice ? NOTICE[notice] : undefined;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [report, { data: sub }] = await Promise.all([
    loadReportByScan(supabase, scanId, organization.id),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", organization.id)
      .maybeSingle(),
  ]);
  if (!report) notFound();

  const { scan } = report;
  const status = scan.status as ScanStatus;
  const statusMeta = STATUS_META[status];
  // Export features (white-label PDF / CSV) follow the enforced plan, so a
  // canceled paid sub loses them rather than keeping them indefinitely.
  const limits = limitsFor(effectivePlan(sub?.plan, sub?.status));
  const canExport = status === "completed" || status === "partial";

  return (
    <div className="space-y-8">
      <div>
        {report.projectId ? (
          <Link
            href={`/projects/${report.projectId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {report.projectName}
          </Link>
        ) : null}

        <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Scan report</h1>
              <ScanStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.clientName ? `${report.clientName} · ` : ""}
              {scan.scan_type === "single" ? "Single page" : "URL list"} · WCAG {scan.wcag_level} ·{" "}
              {formatDateTime(scan.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <form action={rescanScan}>
              <input type="hidden" name="scanId" value={scan.id} />
              <Button type="submit" variant="secondary" size="sm">
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                Re-scan
              </Button>
            </form>
            <form action={deleteScan}>
              <input type="hidden" name="scanId" value={scan.id} />
              <input type="hidden" name="projectId" value={scan.project_id} />
              <ConfirmSubmit
                confirmLabel="Delete"
                prompt="Delete permanently?"
                className="text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </ConfirmSubmit>
            </form>
          </div>
        </header>
      </div>

      {noticeMessage ? <NoticeBanner tone="warning">{noticeMessage}</NoticeBanner> : null}

      {!statusMeta.terminal ? <ScanLive scanId={scan.id} status={status} /> : null}

      {canExport ? (
        <Card>
          <section
            aria-label="Share & export"
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <ShareControl
              scanId={scan.id}
              isPublic={scan.is_public}
              shareToken={scan.share_token}
              appUrl={appBaseUrl()}
            />
            <div className="flex items-center gap-2">
              {limits.whiteLabelPdf ? (
                <a
                  href={`/scans/${scan.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Export PDF
                </a>
              ) : null}
              {limits.dataExport ? (
                <a
                  href={`/scans/${scan.id}/export`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Export CSV
                </a>
              ) : null}
              {!limits.whiteLabelPdf && !limits.dataExport ? (
                <Link
                  href="/settings/billing"
                  className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                >
                  Upgrade to export branded PDF &amp; CSV
                </Link>
              ) : null}
            </div>
          </section>
        </Card>
      ) : null}

      <ReportView
        status={status}
        score={scan.score}
        totals={parseTotals(scan.totals)}
        wcagLevel={scan.wcag_level}
        pagesScanned={scan.pages_scanned}
        finishedAt={scan.finished_at}
        errorReason={scan.error_reason}
        pages={report.pages}
        groups={report.groups}
        totalViolationRows={report.totalViolationRows}
        truncated={report.truncated}
      />
    </div>
  );
}
