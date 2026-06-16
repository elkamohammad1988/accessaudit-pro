import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { archiveProjectRecord, restoreProjectRecord } from "../actions";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: client }, { data: scans }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("id", project.client_id).maybeSingle(),
    supabase
      .from("scans")
      .select("id, status, score, pages_scanned, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const isArchived = Boolean(project.archived_at);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/projects"
          className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
        >
          ← Projects
        </Link>
        <header className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {client ? (
                <Link href={`/clients/${client.id}`} className="underline-offset-4 hover:underline">
                  {client.name}
                </Link>
              ) : (
                "Unknown client"
              )}
              {" · "}
              <a
                href={project.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {project.base_url}
              </a>
              {isArchived ? " · Archived" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}/edit`}
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
            >
              Edit
            </Link>
            {isArchived ? (
              <form action={restoreProjectRecord}>
                <input type="hidden" name="id" value={project.id} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  Restore
                </button>
              </form>
            ) : (
              <form action={archiveProjectRecord}>
                <input type="hidden" name="id" value={project.id} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium text-red-600 hover:bg-[hsl(var(--muted))]"
                >
                  Archive
                </button>
              </form>
            )}
          </div>
        </header>
      </div>

      <section aria-label="Scan history" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Scan history</h2>
          {!isArchived ? (
            <Link
              href={`/scans/new?project=${project.id}`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-3 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              New scan
            </Link>
          ) : null}
        </div>

        {scans && scans.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {scans.map((scan) => (
              <li key={scan.id}>
                <Link
                  href={`/scans/${scan.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--muted))]"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{scan.status}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {new Date(scan.created_at).toLocaleString()} · {scan.pages_scanned} page(s)
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {scan.score != null ? `${scan.score}/100` : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No scans yet. Scans arrive with the scan engine (Phase 2).
          </div>
        )}
      </section>
    </div>
  );
}
