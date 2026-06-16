import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";
import { createProjectRecord } from "../actions";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: preselectedClient } = await searchParams;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", organization.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/projects"
          className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
        >
          ← Projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New project</h1>
      </div>

      {clients && clients.length > 0 ? (
        <ProjectForm
          action={createProjectRecord}
          clients={clients}
          defaultClientId={preselectedClient}
          submitLabel="Create project"
        />
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            You need a client before you can add a project.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            Add a client
          </Link>
        </div>
      )}
    </div>
  );
}
