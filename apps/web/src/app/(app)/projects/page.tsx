import type { Metadata } from "next";
import { FolderKanban, Globe, Plus, ScanLine } from "lucide-react";
import { effectivePlan, limitsFor } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { EntityRow, StatPill } from "@/components/app/entity-row";
import { ArchivedList } from "@/components/app/archived-list";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { rollupScansBy } from "@/lib/scan-format";
import { restoreProjectRecord } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projects");
  return { title: t("metaTitle") };
}

/** Max rows fetched for the list before we surface a "refine" notice. Makes the
 *  bound explicit instead of silently hitting PostgREST's row cap; generous enough
 *  that only unlimited-tier orgs can approach it. */
const LIST_PAGE_LIMIT = 200;

export default async function ProjectsPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const t = await getTranslations("projects");
  const tc = await getTranslations("common");
  const tp = await getTranslations("plans");
  const tn = await getTranslations("nav");
  const [{ data: projects, error: projectsError }, { data: clients }, { data: sub }, { data: allScans }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, base_url, client_id, archived_at, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(LIST_PAGE_LIMIT + 1),
      supabase.from("clients").select("id, name").eq("organization_id", organization.id),
      supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      // Per-project rollups: scan count + the most recent scored scan's score.
      supabase
        .from("scans")
        .select("id, project_id, score, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name] as const));
  const rollup = rollupScansBy(allScans ?? [], (projectId) => projectId);
  const projectRows = projects ?? [];
  const truncated = projectRows.length > LIST_PAGE_LIMIT;
  const visible = truncated ? projectRows.slice(0, LIST_PAGE_LIMIT) : projectRows;
  const active = visible.filter((p) => !p.archived_at);
  const archived = visible.filter((p) => p.archived_at);
  // Show the *enforced* plan's limit (a canceled paid sub falls back to free), so
  // the badge always matches what createProjectRecord actually allows.
  const limit = limitsFor(effectivePlan(sub?.plan, sub?.status)).projects;
  const hasClients = (clients ?? []).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: tn("app.dashboard"), href: "/dashboard" }, { label: tn("app.projects") }]}
        title={t("title")}
        subtitle={
          <>
            {t("subtitle")}
            <Badge variant="secondary">
              {active.length} / {displayLimit(limit, tp)}
            </Badge>
          </>
        }
        actions={
          <ButtonLink href="/projects/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("new")}
          </ButtonLink>
        }
      />

      {truncated ? (
        <NoticeBanner tone="info">{tc("labels.listTruncated", { count: LIST_PAGE_LIMIT })}</NoticeBanner>
      ) : null}

      {projectsError ? (
        <NoticeBanner tone="error">{t("loadError")}</NoticeBanner>
      ) : active.length > 0 ? (
        <Card className="overflow-hidden">
          <ul className="divide-y">
            {active.map((project) => {
              const stats = rollup.get(project.id);
              const sc = stats?.scans ?? 0;
              const score = stats?.latestScore ?? null;
              return (
                <EntityRow
                  key={project.id}
                  href={`/projects/${project.id}`}
                  title={project.name}
                  subtitle={`${clientName.get(project.client_id) ?? t("unknownClient")} · ${project.base_url}`}
                  subtitleIcon={Globe}
                  monogramName={project.name}
                  stats={
                    <>
                      <StatPill icon={ScanLine} value={sc} label={tc.plural("stats.scans", sc)} />
                    </>
                  }
                  score={score}
                  scoreLabel={score != null ? tc("score.aria", { score }) : tc("stats.noScans")}
                />
              );
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={t("emptyTitle")}
          description={hasClients ? t("emptyHasClients") : t("emptyNoClients")}
          action={
            <ButtonLink href={hasClients ? "/projects/new" : "/clients/new"}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {hasClients ? t("emptyActionHasClients") : t("emptyActionNoClients")}
            </ButtonLink>
          }
        />
      )}

      <ArchivedList items={archived} restoreAction={restoreProjectRecord} />
    </div>
  );
}
