import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ScanStatus } from "@accessaudit/shared";
import type { Violation } from "@accessaudit/database";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_META, parseTotals } from "@/lib/scan-format";
import { groupViolations } from "@/lib/report";
import { ReportView, type ReportPage } from "@/components/scans/report-view";
import { ScanLive } from "@/components/scans/scan-live";
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
  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("id", scanId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!scan) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, client_id")
    .eq("id", scan.project_id)
    .maybeSingle();
  const { data: client } = project
    ? await supabase.from("clients").select("name").eq("id", project.client_id).maybeSingle()
    : { data: null };

  const { data: pages } = await supabase
    .from("scan_pages")
    .select("id, url, status, http_status, score, totals")
    .eq("scan_id", scan.id)
    .order("created_at", { ascending: true });

  const pageRows = pages ?? [];
  const pageIds = pageRows.map((p) => p.id);

  let violations: Violation[] = [];
  if (pageIds.length > 0) {
    const { data } = await supabase.from("violations").select("*").in("scan_page_id", pageIds);
    violations = data ?? [];
  }

  const pageUrlById = new Map(pageRows.map((p) => [p.id, p.url] as const));
  const groups = groupViolations(violations, pageUrlById);
  const reportPages: ReportPage[] = pageRows.map((p) => ({
    url: p.url,
    status: p.status,
    httpStatus: p.http_status,
    score: p.score,
    totals: parseTotals(p.totals),
  }));

  const status = scan.status as ScanStatus;
  const statusMeta = STATUS_META[status];

  return (
    <div className="space-y-8">
      <div>
        {project ? (
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
          >
            ← {project.name}
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
              {client?.name ? `${client.name} · ` : ""}
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

      <ReportView
        status={status}
        score={scan.score}
        totals={parseTotals(scan.totals)}
        wcagLevel={scan.wcag_level}
        pagesScanned={scan.pages_scanned}
        finishedAt={scan.finished_at}
        errorReason={scan.error_reason}
        pages={reportPages}
        groups={groups}
      />
    </div>
  );
}
