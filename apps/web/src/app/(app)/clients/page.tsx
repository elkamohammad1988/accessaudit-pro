import type { Metadata } from "next";
import { FolderKanban, Mail, Plus, ScanLine, Users } from "lucide-react";
import { effectivePlan, limitsFor } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { EntityRow, ScorePill, StatPill } from "@/components/app/entity-row";
import { ArchivedList } from "@/components/app/archived-list";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { rollupScansBy } from "@/lib/scan-format";
import { restoreClientRecord } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clients");
  return { title: t("metaTitle") };
}

/** Max rows fetched for the list before we surface a "refine" notice. Makes the
 *  bound explicit instead of silently hitting PostgREST's row cap; generous enough
 *  that only unlimited-tier orgs can approach it. */
const LIST_PAGE_LIMIT = 200;

export default async function ClientsPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const t = await getTranslations("clients");
  const tc = await getTranslations("common");
  const tp = await getTranslations("plans");
  const tn = await getTranslations("nav");
  const [{ data: clients, error: clientsError }, { data: sub }, { data: allProjects }, { data: allScans }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, contact_email, archived_at, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(LIST_PAGE_LIMIT + 1),
      supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      // Rollup source: every project (to attribute scans → client and count active
      // projects per client) and every scan, newest first (for count + latest score).
      supabase
        .from("projects")
        .select("id, client_id, archived_at")
        .eq("organization_id", organization.id)
        .limit(1000),
      supabase
        .from("scans")
        .select("id, project_id, score, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

  // Per-client rollups: active project count, total scan count, and the most recent
  // scored scan's score. Scans carry only project_id, so we hop project → client.
  const projectClient = new Map<string, string>();
  const projectCount = new Map<string, number>();
  for (const p of allProjects ?? []) {
    projectClient.set(p.id, p.client_id);
    if (!p.archived_at) projectCount.set(p.client_id, (projectCount.get(p.client_id) ?? 0) + 1);
  }
  // Scans carry only project_id, so the key hops project → client.
  const rollup = rollupScansBy(allScans ?? [], (projectId) => projectClient.get(projectId));

  const rows = clients ?? [];
  const truncated = rows.length > LIST_PAGE_LIMIT;
  const visible = truncated ? rows.slice(0, LIST_PAGE_LIMIT) : rows;
  const active = visible.filter((c) => !c.archived_at);
  const archived = visible.filter((c) => c.archived_at);
  // Show the *enforced* plan's limit (a canceled paid sub falls back to free), so
  // the badge always matches what createClientRecord actually allows.
  const limit = limitsFor(effectivePlan(sub?.plan, sub?.status)).clients;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[{ label: tn("app.dashboard"), href: "/dashboard" }, { label: tn("app.clients") }]}
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
          <ButtonLink href="/clients/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("new")}
          </ButtonLink>
        }
      />

      {truncated ? (
        <NoticeBanner tone="info">{tc("labels.listTruncated", { count: LIST_PAGE_LIMIT })}</NoticeBanner>
      ) : null}

      {clientsError ? (
        <NoticeBanner tone="error">{t("loadError")}</NoticeBanner>
      ) : active.length > 0 ? (
        <Card className="overflow-hidden">
          <ul className="divide-y">
            {active.map((client) => {
              const pc = projectCount.get(client.id) ?? 0;
              const stats = rollup.get(client.id);
              const sc = stats?.scans ?? 0;
              const score = stats?.latestScore ?? null;
              return (
                <EntityRow
                  key={client.id}
                  href={`/clients/${client.id}`}
                  title={client.name}
                  subtitle={client.contact_email ?? t("noContactEmail")}
                  subtitleIcon={Mail}
                  monogramName={client.name}
                  stats={
                    <>
                      <StatPill icon={FolderKanban} value={pc} label={tc.plural("stats.projects", pc)} />
                      <StatPill icon={ScanLine} value={sc} label={tc.plural("stats.scans", sc)} />
                      <ScorePill
                        score={score}
                        label={score != null ? tc("score.aria", { score }) : tc("stats.noScans")}
                      />
                    </>
                  }
                />
              );
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <ButtonLink href="/clients/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("emptyAction")}
            </ButtonLink>
          }
        />
      )}

      <ArchivedList items={archived} restoreAction={restoreClientRecord} />
    </div>
  );
}
