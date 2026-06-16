import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Scan, Violation } from "@accessaudit/database";
import { parseTotals } from "@/lib/scan-format";
import { groupViolations, type GroupedViolation } from "@/lib/report";
import type { ReportPage } from "@/components/scans/report-view";

export interface ReportData {
  scan: Scan;
  projectId: string | null;
  projectName: string | null;
  clientName: string | null;
  pages: ReportPage[];
  groups: GroupedViolation[];
  /** Raw rows, for exports. */
  violations: Violation[];
  pageUrlById: Map<string, string>;
}

async function assemble(supabase: SupabaseClient<Database>, scan: Scan): Promise<ReportData> {
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
  };
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
