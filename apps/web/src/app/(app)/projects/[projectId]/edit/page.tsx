import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProjectRecord } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projects");
  return { title: t("metaEdit") };
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const t = await getTranslations("projects");
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
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {project.name}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t("metaEdit")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("editIntro")}</p>
      </div>
      <ProjectForm
        action={updateProjectRecord}
        clients={clients ?? []}
        project={project}
        submitLabel={t("editSubmit")}
      />
    </div>
  );
}
