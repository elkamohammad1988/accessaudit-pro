import { effectivePlan, limitsFor } from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";
import { fetchAllViolationsForExport, loadReportByScan } from "@/lib/load-report";
import { parseNodes } from "@/lib/report";
import { rowsToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ scanId: string }> },
): Promise<Response> {
  const { scanId } = await ctx.params;
  const { supabase, organization } = await requireOrg();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", organization.id)
    .maybeSingle();
  const plan = effectivePlan(sub?.plan, sub?.status);
  if (!limitsFor(plan).dataExport) {
    return new Response("CSV export is available on paid plans. Upgrade to enable it.", {
      status: 403,
    });
  }

  const report = await loadReportByScan(supabase, scanId, organization.id);
  if (!report) {
    return new Response("Scan not found.", { status: 404 });
  }

  const header = [
    "Page URL",
    "Impact",
    "Rule",
    "WCAG",
    "Description",
    "Help URL",
    "Selector",
    "Failure summary",
  ];
  const rows: string[][] = [header];

  // Export the complete record (paginated past the row cap), not the capped
  // on-screen set — the CSV is the authoritative deliverable.
  const allViolations = await fetchAllViolationsForExport(supabase, [...report.pageUrlById.keys()]);

  for (const v of allViolations) {
    const pageUrl = report.pageUrlById.get(v.scan_page_id) ?? "";
    const wcag = (v.wcag_criteria ?? []).join(" ");
    const nodes = parseNodes(v.nodes);
    if (nodes.length === 0) {
      rows.push([pageUrl, v.impact, v.rule_id, wcag, v.description ?? "", v.help_url ?? "", "", ""]);
    } else {
      for (const node of nodes) {
        rows.push([
          pageUrl,
          v.impact,
          v.rule_id,
          wcag,
          v.description ?? "",
          v.help_url ?? "",
          node.target.join(" "),
          node.failureSummary,
        ]);
      }
    }
  }

  const csv = rowsToCsv(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="accessaudit-scan-${scanId.slice(0, 8)}.csv"`,
    },
  });
}
