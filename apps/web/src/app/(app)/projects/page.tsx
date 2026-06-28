import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, FolderKanban, Globe, Plus } from "lucide-react";
import { formatLimit, limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { restoreProjectRecord } from "./actions";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [{ data: projects, error: projectsError }, { data: clients }, { data: sub }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, base_url, client_id, archived_at, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").eq("organization_id", organization.id),
    supabase.from("subscriptions").select("plan").eq("organization_id", organization.id).maybeSingle(),
  ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name] as const));
  const active = (projects ?? []).filter((p) => !p.archived_at);
  const archived = (projects ?? []).filter((p) => p.archived_at);
  const plan: PlanTier = sub?.plan ?? "free";
  const limit = limitsFor(plan).projects;
  const hasClients = (clients ?? []).length > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            The websites you audit
            <Badge variant="secondary">
              {active.length} / {formatLimit(limit)}
            </Badge>
          </p>
        </div>
        <ButtonLink href="/projects/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New project
        </ButtonLink>
      </header>

      {projectsError ? (
        <NoticeBanner tone="error">
          We couldn&apos;t load your projects just now. Refresh the page to try again — if it keeps
          happening, the issue is on our side, not yours.
        </NoticeBanner>
      ) : active.length > 0 ? (
        <Card className="overflow-hidden">
          <ul className="divide-y">
            {active.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/15 to-brand-2/10 text-brand ring-1 ring-inset ring-brand/15">
                      <FolderKanban className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{project.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {clientName.get(project.client_id) ?? "Unknown client"} · {project.base_url}
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
          title="No projects yet"
          description={
            hasClients
              ? "Add a website to start auditing it."
              : "Add a client first, then create a project (their website) under it."
          }
          action={
            <ButtonLink href={hasClients ? "/projects/new" : "/clients/new"}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {hasClients ? "Add your first project" : "Add a client"}
            </ButtonLink>
          }
        />
      )}

      {archived.length > 0 ? (
        <details className="group rounded-xl border bg-card px-4 py-3 shadow-xs transition-colors hover:border-foreground/15">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
            Archived ({archived.length})
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
                    Restore
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
