import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { effectivePlan, limitsFor, type ScanStatus } from "@accessaudit/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTotals } from "@/lib/scan-format";
import { loadReportByToken } from "@/lib/load-report";
import { ReportView } from "@/components/scans/report-view";

// Tokenized public links — resolved server-side with the service-role client.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Accessibility report",
  robots: { index: false, follow: false },
};

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const report = await loadReportByToken(admin, token);
  if (!report) notFound();

  const { scan } = report;
  const [{ data: org }, { data: sub }] = await Promise.all([
    admin
      .from("organizations")
      .select("name, logo_url, brand_color")
      .eq("id", scan.organization_id)
      .maybeSingle(),
    admin
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", scan.organization_id)
      .maybeSingle(),
  ]);

  // Use the EFFECTIVE plan (canceled/unpaid → free) so a lapsed paid org doesn't
  // keep white-label removal on its public links indefinitely.
  const plan = effectivePlan(sub?.plan, sub?.status);
  const showPoweredBy = !limitsFor(plan).removePoweredBy;
  const brandColor = org?.brand_color ?? "#4F46E5";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: brandColor }} />

      <header className="mt-6 flex items-center gap-4">
        {org?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logo_url} alt={`${org.name} logo`} className="h-10 w-auto" />
        ) : null}
        <div>
          <p className="text-lg font-semibold">{org?.name ?? "Accessibility report"}</p>
          <p className="text-sm text-muted-foreground">
            {report.clientName ? `${report.clientName} · ` : ""}
            WCAG {scan.wcag_level} · {new Date(scan.created_at).toLocaleDateString()}
          </p>
        </div>
      </header>

      <h1 className="mt-8 text-2xl font-semibold">Accessibility audit</h1>

      <div className="mt-6">
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
          totalViolationRows={report.totalViolationRows}
          truncated={report.truncated}
        />
      </div>

      {showPoweredBy ? (
        <footer className="mt-10 border-t pt-4 text-center text-xs text-muted-foreground">
          Powered by AccessAudit Pro
        </footer>
      ) : null}
    </main>
  );
}
