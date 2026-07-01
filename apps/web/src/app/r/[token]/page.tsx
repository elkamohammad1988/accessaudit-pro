import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { effectivePlan, limitsFor, type ScanStatus } from "@accessaudit/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTotals } from "@/lib/scan-format";
import { loadReportByToken } from "@/lib/load-report";
import { getTranslations, getLocale } from "@/i18n/server";
import { formatDateTime } from "@/lib/dates";
import { ReportView } from "@/components/scans/report-view";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// Tokenized public links — resolved server-side with the service-role client.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scans.public");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const t = await getTranslations("scans");
  const locale = await getLocale();
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
  const brandColor = org?.brand_color ?? "#A24425";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      {/* Clients view this deliverable on their own devices/time — let them read
       * it in their preferred theme. Hidden when the report is printed/saved. */}
      <ThemeToggle className="no-print fixed end-4 top-4 z-20 border bg-card/80 shadow-sm backdrop-blur-sm" />
      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: brandColor }} />

      <header className="mt-5 flex items-center gap-3">
        {org?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logo_url} alt={t("logoAlt", { name: org.name ?? "" })} className="h-10 w-auto" />
        ) : null}
        <div>
          <p className="text-lg font-semibold">{org?.name ?? t("public.metaTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {report.clientName ? `${report.clientName} · ` : ""}
            {t("wcagShort", { level: scan.wcag_level })} · {formatDateTime(scan.created_at, locale)}
          </p>
        </div>
      </header>

      <h1 className="mt-6 text-2xl font-semibold">{t("auditHeading")}</h1>

      <div className="mt-5">
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
        <footer className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          {t("poweredBy")}
        </footer>
      ) : null}
    </main>
  );
}
