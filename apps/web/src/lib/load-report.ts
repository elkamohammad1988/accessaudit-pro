import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Scan, Violation } from "@accessaudit/database";
import { parseTotals } from "@/lib/scan-format";
import { groupViolations, type GroupedViolation } from "@/lib/report";
import type { ReportPage } from "@/components/scans/report-view";

/**
 * Hard cap on violation rows assembled for the on-screen report. PostgREST also
 * caps responses (config `max_rows`), so an uncapped query would *silently*
 * truncate a huge scan into a report that looks complete. We instead cap
 * explicitly, fetch worst-severity-first, and surface `truncated` so the UI can
 * say so and point users at the (complete) CSV export.
 */
export const REPORT_VIOLATION_DISPLAY_LIMIT = 1000;

export interface ReportData {
  scan: Scan;
  projectId: string | null;
  projectName: string | null;
  clientName: string | null;
  pages: ReportPage[];
  groups: GroupedViolation[];
  /** Raw rows (capped to the display limit), for in-page rendering. */
  violations: Violation[];
  pageUrlById: Map<string, string>;
  /** Total violation rows that exist for this scan (may exceed those loaded). */
  totalViolationRows: number;
  /** True when more violations exist than were loaded for display. */
  truncated: boolean;
}

async function assemble(supabase: SupabaseClient<Database>, scan: Scan): Promise<ReportData> {
  // project and pages are independent — fetch concurrently instead of in series.
  const [{ data: project }, { data: pages }] = await Promise.all([
    supabase.from("projects").select("id, name, client_id").eq("id", scan.project_id).maybeSingle(),
    supabase
      .from("scan_pages")
      .select("id, url, status, http_status, score, totals")
      .eq("scan_id", scan.id)
      .order("created_at", { ascending: true }),
  ]);

  const pageRows = pages ?? [];
  const pageIds = pageRows.map((p) => p.id);

  // client (needs project.client_id), violations, and the total-row count (needs
  // pageIds) are independent of each other — run them concurrently in round two.
  // Violations are ordered worst-severity-first (the enum lists 'critical' first),
  // so a capped report still shows the issues that matter most.
  const [{ data: client }, { data: violationRows }, { count: violationCount }] = await Promise.all([
    project
      ? supabase.from("clients").select("name").eq("id", project.client_id).maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
    pageIds.length > 0
      ? supabase
          .from("violations")
          .select("*")
          .in("scan_page_id", pageIds)
          .order("impact", { ascending: true })
          .limit(REPORT_VIOLATION_DISPLAY_LIMIT)
      : Promise.resolve({ data: [] as Violation[] }),
    pageIds.length > 0
      ? supabase
          .from("violations")
          .select("id", { count: "exact", head: true })
          .in("scan_page_id", pageIds)
      : Promise.resolve({ count: 0 }),
  ]);
  const violations: Violation[] = violationRows ?? [];
  const totalViolationRows = violationCount ?? violations.length;

  const pageUrlById = new Map(pageRows.map((p) => [p.id, p.url] as const));

  return {
    scan,
    projectId: project?.id ?? null,
    projectName: project?.name ?? null,
    clientName: client?.name ?? null,
    pages: pageRows.map((p) => ({
      url: p.url,
      status: p.status,
      httpStatus: p.http_status,
      score: p.score,
      totals: parseTotals(p.totals),
    })),
    groups: groupViolations(violations, pageUrlById),
    violations,
    pageUrlById,
    totalViolationRows,
    truncated: totalViolationRows > violations.length,
  };
}

/**
 * Complete violation fetch for CSV export, paginating past the PostgREST row cap
 * so the exported file is the authoritative full record even when the on-screen
 * report is truncated.
 */
export async function fetchAllViolationsForExport(
  supabase: SupabaseClient<Database>,
  pageIds: string[],
): Promise<Violation[]> {
  if (pageIds.length === 0) return [];
  const PAGE = 1000;
  const all: Violation[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("violations")
      .select("*")
      .in("scan_page_id", pageIds)
      .order("impact", { ascending: true })
      .range(from, from + PAGE - 1);
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return all;
}

/** Owner path (RLS-scoped client). */
export async function loadReportByScan(
  supabase: SupabaseClient<Database>,
  scanId: string,
  organizationId: string,
): Promise<ReportData | null> {
  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("id", scanId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!scan) return null;
  return assemble(supabase, scan);
}

/** Public path (service-role client; only resolves shared, public scans). */
export async function loadReportByToken(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<ReportData | null> {
  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("share_token", token)
    .eq("is_public", true)
    .maybeSingle();
  if (!scan) return null;
  return assemble(supabase, scan);
}
