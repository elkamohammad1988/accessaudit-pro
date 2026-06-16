import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { limitsFor, type PlanTier, type ScanStatus } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { STATUS_META, parseTotals } from "@/lib/scan-format";
import { loadReportByScan } from "@/lib/load-report";
import { ReportView } from "@/components/scans/report-view";
import { ScanLive } from "@/components/scans/scan-live";
import { ShareControl } from "@/components/scans/share-control";
import { rescanScan, deleteScan } from "../actions";

export const metadata: Metadata = { title: "Scan report" };

export default async function ScanReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [report, { data: sub }] = await Promise.all([
    loadReportByScan(supabase, scanId, organization.id),
    supabase.from("subscriptions").select("plan").eq("organization_id", organization.id).maybeSingle(),
  ]);
  if (!report) notFound();

  const { scan } = report;
  const status = scan.status as ScanStatus;
  const statusMeta = STATUS_META[status];
  const plan: PlanTier = sub?.plan ?? "free";
  const limits = limitsFor(plan);
  const canExport = status === "completed" || status === "partial";

  return (
    <div className="space-y-8">
      <div>
        {report.projectId ? (
          <Link
            href={`/projects/${report.projectId}`}
            className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
          >
            ← {report.projectName}
          </Link>
        ) : null}

        <header className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Scan report</h1>
              <span
                className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {report.clientName ? `${report.clientName} · ` : ""}
              {scan.scan_type === "single" ? "Single page" : "URL list"} · WCAG {scan.wcag_level} ·{" "}
              {new Date(scan.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <form action={rescanScan}>
              <input type="hidden" name="scanId" value={scan.id} />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
              >
                Re-scan
              </button>
            </form>
            <form action={deleteScan}>
              <input type="hidden" name="scanId" value={scan.id} />
              <input type="hidden" name="projectId" value={scan.project_id} />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium text-red-600 hover:bg-[hsl(var(--muted))]"
              >
                Delete
              </button>
            </form>
          </div>
        </header>
      </div>

      {!statusMeta.terminal ? <ScanLive scanId={scan.id} status={status} /> : null}

      {canExport ? (
        <section
          aria-label="Share & export"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
        >
          <ShareControl
            scanId={scan.id}
            isPublic={scan.is_public}
            shareToken={scan.share_token}
            appUrl={publicEnv.appUrl}
          />
          <div className="flex items-center gap-2">
            {limits.whiteLabelPdf ? (
              <a
                href={`/scans/${scan.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
              >
                Export PDF
              </a>
            ) : null}
            {limits.dataExport ? (
              <a
                href={`/scans/${scan.id}/export`}
                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
              >
                Export CSV
              </a>
            ) : null}
            {!limits.whiteLabelPdf && !limits.dataExport ? (
              <Link
                href="/settings/billing"
                className="text-sm text-brand underline-offset-4 hover:underline"
              >
                Upgrade to export branded PDF &amp; CSV
              </Link>
            ) : null}
          </div>
        </section>
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
      />
    </div>
  );
}
