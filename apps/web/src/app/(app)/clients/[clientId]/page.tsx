import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Globe, Pencil, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { archiveClientRecord, restoreClientRecord } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clients");
  return { title: t("metaDetail") };
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { clientId } = await params;
  const { notice } = await searchParams;
  const t = await getTranslations("clients");
  const tc = await getTranslations("common");

  const NOTICE: Record<string, string> = {
    "archive-failed": t("messages.archiveFailed"),
    "restore-failed": t("messages.restoreFailed"),
  };
  const noticeMessage = notice ? NOTICE[notice] : undefined;
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
    <div className="space-y-6">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("title")}
        </Link>
        <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {client.contact_email ?? t("noContactEmail")}
              {isArchived ? ` · ${t("archivedLabel")}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href={`/clients/${client.id}/edit`} variant="secondary" size="sm">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {tc("actions.edit")}
            </ButtonLink>
            {isArchived ? (
              <form action={restoreClientRecord}>
                <input type="hidden" name="id" value={client.id} />
                <Button type="submit" variant="secondary" size="sm">
                  {tc("actions.restore")}
                </Button>
              </form>
            ) : (
              <form action={archiveClientRecord}>
                <input type="hidden" name="id" value={client.id} />
                <ConfirmSubmit
                  confirmLabel={t("archiveConfirmLabel")}
                  prompt={t("confirmArchive")}
                  className="text-danger-strong hover:bg-danger/10"
                >
                  {tc("actions.archive")}
                </ConfirmSubmit>
              </form>
            )}
          </div>
        </header>
      </div>

      {noticeMessage ? <NoticeBanner tone="error">{noticeMessage}</NoticeBanner> : null}

      {client.notes ? (
        <Card>
          <section aria-label={t("notesHeading")} className="p-5">
            <h2 className="mb-1.5 text-base font-semibold tracking-tight">{t("notesHeading")}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{client.notes}</p>
          </section>
        </Card>
      ) : null}

      <section aria-label={t("projectsHeading")} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("projectsHeading")}</h2>
          <ButtonLink href={`/projects/new?client=${client.id}`} size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newProject")}
          </ButtonLink>
        </div>

        {projects && projects.length > 0 ? (
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-inset ring-brand/15">
                        <Globe className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{project.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{project.base_url}</p>
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
            icon={Globe}
            title={t("noProjectsTitle")}
            description={t("noProjectsDescription")}
            action={
              <ButtonLink href={`/projects/new?client=${client.id}`} size="sm">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("addProject")}
              </ButtonLink>
            }
          />
        )}
      </section>
    </div>
  );
}
