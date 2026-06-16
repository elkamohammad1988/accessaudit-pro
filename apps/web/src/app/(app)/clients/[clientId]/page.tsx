import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { archiveClientRecord, restoreClientRecord } from "../actions";

export const metadata: Metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!client) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, base_url, archived_at, created_at")
    .eq("client_id", client.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const isArchived = Boolean(client.archived_at);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/clients"
          className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
        >
          ← Clients
        </Link>
        <header className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {client.contact_email ?? "No contact email"}
              {isArchived ? " · Archived" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/clients/${client.id}/edit`}
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
            >
              Edit
            </Link>
            {isArchived ? (
              <form action={restoreClientRecord}>
                <input type="hidden" name="id" value={client.id} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  Restore
                </button>
              </form>
            ) : (
              <form action={archiveClientRecord}>
                <input type="hidden" name="id" value={client.id} />
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

      {client.notes ? (
        <section aria-label="Notes" className="rounded-lg border p-4">
          <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
        </section>
      ) : null}

      <section aria-label="Projects" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Projects</h2>
          <Link
            href={`/projects/new?client=${client.id}`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-3 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            New project
          </Link>
        </div>

        {projects && projects.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--muted))]"
                >
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{project.base_url}</p>
                  </div>
                  <span aria-hidden="true" className="text-[hsl(var(--muted-foreground))]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No projects under this client yet. Add the website you want to audit.
          </div>
        )}
      </section>
    </div>
  );
}
