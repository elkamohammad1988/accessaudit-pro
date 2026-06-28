import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Plus, ScanLine } from "lucide-react";
import type { ScanStatus } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/dates";
import { scoreClassName } from "@/lib/scan-format";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { ScanStatusBadge } from "@/components/scans/scan-status-badge";
import { archiveProjectRecord, restoreProjectRecord } from "../actions";

export const metadata: Metadata = { title: "Project" };

const NOTICE: Record<string, string> = {
  "archive-failed": "Couldn't archive this project. Please try again.",
  "restore-failed": "Couldn't restore this project. Please try again.",
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { projectId } = await params;
  const { notice } = await searchParams;
  const noticeMessage = notice ? NOTICE[notice] : undefined;
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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Projects
        </Link>
        <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
              {client ? (
                <Link href={`/clients/${client.id}`} className="underline-offset-4 hover:text-foreground hover:underline">
                  {client.name}
                </Link>
              ) : (
                "Unknown client"
              )}
              <span aria-hidden="true">·</span>
              <a
                href={project.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1 break-all underline-offset-4 hover:text-foreground hover:underline"
              >
                <span className="break-all">{project.base_url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
              {isArchived ? <span>· Archived</span> : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href={`/projects/${project.id}/edit`} variant="secondary" size="sm">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </ButtonLink>
            {isArchived ? (
              <form action={restoreProjectRecord}>
                <input type="hidden" name="id" value={project.id} />
                <Button type="submit" variant="secondary" size="sm">
                  Restore
                </Button>
              </form>
            ) : (
              <form action={archiveProjectRecord}>
                <input type="hidden" name="id" value={project.id} />
                <ConfirmSubmit
                  confirmLabel="Archive project"
                  prompt="Archive this project?"
                  className="text-danger-strong hover:bg-danger/10"
                >
                  Archive
                </ConfirmSubmit>
              </form>
            )}
          </div>
        </header>
      </div>

      {noticeMessage ? <NoticeBanner tone="error">{noticeMessage}</NoticeBanner> : null}

      <section aria-label="Scan history" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Scan history</h2>
          {!isArchived ? (
            <ButtonLink href={`/scans/new?project=${project.id}`} size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New scan
            </ButtonLink>
          ) : null}
        </div>

        {scans && scans.length > 0 ? (
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {scans.map((scan) => (
                <li key={scan.id}>
                  <Link
                    href={`/scans/${scan.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <ScanStatusBadge status={scan.status as ScanStatus} />
                      <div>
                        <p className="text-sm font-medium">
                          {scan.pages_scanned} page{scan.pages_scanned === 1 ? "" : "s"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(scan.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${scoreClassName(scan.score)}`}>
                      {scan.score != null ? `${scan.score}/100` : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState
            icon={ScanLine}
            title="No scans yet"
            description="Run your first accessibility audit for this website to see results here."
            action={
              !isArchived ? (
                <ButtonLink href={`/scans/new?project=${project.id}`} size="sm">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Run a scan
                </ButtonLink>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
