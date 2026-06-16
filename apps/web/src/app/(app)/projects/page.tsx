import type { Metadata } from "next";
import Link from "next/link";
import { formatLimit, limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { restoreProjectRecord } from "./actions";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [{ data: projects }, { data: clients }, { data: sub }] = await Promise.all([
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {active.length} / {formatLimit(limit)} on the {limitsFor(plan).label} plan
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          New project
        </Link>
      </header>

      {active.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {active.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--muted))]"
              >
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {clientName.get(project.client_id) ?? "Unknown client"} · {project.base_url}
                  </p>
                </div>
                <span aria-hidden="true" className="text-[hsl(var(--muted-foreground))]">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {hasClients
              ? "Add a website to start auditing it."
              : "Add a client first, then create a project (their website) under it."}
          </p>
          <Link
            href={hasClients ? "/projects/new" : "/clients/new"}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            {hasClients ? "Add your first project" : "Add a client"}
          </Link>
        </div>
      )}

      {archived.length > 0 ? (
        <details className="rounded-lg border px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">
            Archived ({archived.length})
          </summary>
          <ul className="mt-2 divide-y">
            {archived.map((project) => (
              <li key={project.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{project.name}</span>
                <form action={restoreProjectRecord}>
                  <input type="hidden" name="id" value={project.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
