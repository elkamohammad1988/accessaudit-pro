import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectForm } from "@/components/projects/project-form";
import { createProjectRecord } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projects");
  return { title: t("metaNew") };
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: preselectedClient } = await searchParams;
  const t = await getTranslations("projects");
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
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("title")}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("newIntro")}</p>
      </div>

      {clients && clients.length > 0 ? (
        <ProjectForm
          action={createProjectRecord}
          clients={clients}
          defaultClientId={preselectedClient}
          submitLabel={t("createSubmit")}
        />
      ) : (
        <EmptyState
          icon={UserPlus}
          title={t("noClientsTitle")}
          description={t("noClientsDescription")}
          action={
            <ButtonLink href="/clients/new">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {t("emptyActionNoClients")}
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
