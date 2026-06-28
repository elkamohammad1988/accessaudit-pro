import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Projects
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Point AccessAudit at a client&apos;s website. You can re-scan it any time.
        </p>
      </div>

      {clients && clients.length > 0 ? (
        <ProjectForm
          action={createProjectRecord}
          clients={clients}
          defaultClientId={preselectedClient}
          submitLabel="Create project"
        />
      ) : (
        <EmptyState
          icon={UserPlus}
          title="No clients yet"
          description="You need a client before you can add a project (their website)."
          action={
            <ButtonLink href="/clients/new">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add a client
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
