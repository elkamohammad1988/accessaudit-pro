import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { effectivePlan, limitsFor } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NewScanForm } from "@/components/scans/new-scan-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scans.new");
  return { title: t("metaTitle") };
}

export default async function NewScanPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: preselectedProject } = await searchParams;
  const { organization } = await requireSession();
  if (!organization) return null;

  const t = await getTranslations("scans.new");

  const supabase = await createClient();
  const [{ data: projects }, { data: sub }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, base_url")
      .eq("organization_id", organization.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", organization.id)
      .maybeSingle(),
  ]);

  // The per-scan page cap must match enforcement (createScan uses effectivePlan),
  // so a canceled paid sub sees the free cap rather than its old, higher one.
  const plan = effectivePlan(sub?.plan, sub?.status);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("dashboard")}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {projects && projects.length > 0 ? (
        <NewScanForm
          projects={projects}
          defaultProjectId={preselectedProject}
          pagesPerScan={limitsFor(plan).pagesPerScan}
        />
      ) : (
        <EmptyState
          icon={FolderPlus}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <ButtonLink href="/projects/new">
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              {t("emptyAction")}
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
