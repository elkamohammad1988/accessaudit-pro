import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, FolderKanban, Globe, Plus } from "lucide-react";
import { effectivePlan, limitsFor } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
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
  const [{ data: projects, error: projectsError }, { data: clients }, { data: sub }] = await Promise.all([
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
  ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name] as const));
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {t("subtitle")}
            <Badge variant="secondary">
              {active.length} / {displayLimit(limit, tp)}
            </Badge>
          </p>
        </div>
        <ButtonLink href="/projects/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("new")}
        </ButtonLink>
      </header>

      {truncated ? (
        <NoticeBanner tone="info">{tc("labels.listTruncated", { count: LIST_PAGE_LIMIT })}</NoticeBanner>
      ) : null}

      {projectsError ? (
        <NoticeBanner tone="error">{t("loadError")}</NoticeBanner>
      ) : active.length > 0 ? (
        <Card className="overflow-hidden">
          <ul className="divide-y">
            {active.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-inset ring-brand/15">
                      <FolderKanban className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{project.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {clientName.get(project.client_id) ?? t("unknownClient")} · {project.base_url}
                        </span>
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
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

      {archived.length > 0 ? (
        <details className="group rounded-xl border bg-card px-4 py-3 shadow-xs transition-colors hover:border-foreground/15">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
            {tc("labels.archivedCount", { count: archived.length })}
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          <ul className="mt-2 divide-y border-t pt-1">
            {archived.map((project) => (
              <li key={project.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{project.name}</span>
                <form action={restoreProjectRecord}>
                  <input type="hidden" name="id" value={project.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    {tc("actions.restore")}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
