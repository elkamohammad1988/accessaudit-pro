import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProjectRecord } from "../../actions";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({
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

  // Offer active clients plus the project's current client (even if archived),
  // so editing never silently drops the existing assignment.
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", organization.id)
    .or(`archived_at.is.null,id.eq.${project.client_id}`)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit project</h1>
      </div>
      <ProjectForm
        action={updateProjectRecord}
        clients={clients ?? []}
        project={project}
        submitLabel="Save changes"
      />
    </div>
  );
}
