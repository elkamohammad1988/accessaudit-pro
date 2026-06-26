import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NewScanForm } from "@/components/scans/new-scan-form";

export const metadata: Metadata = { title: "New scan" };

export default async function NewScanPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: preselectedProject } = await searchParams;
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [{ data: projects }, { data: sub }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, base_url")
      .eq("organization_id", organization.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("plan").eq("organization_id", organization.id).maybeSingle(),
  ]);

  const plan: PlanTier = sub?.plan ?? "free";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">New scan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Run a WCAG 2.2 accessibility audit against a page or a list of pages.
        </p>
      </div>

      {projects && projects.length > 0 ? (
        <NewScanForm
          projects={projects}
          defaultProjectId={preselectedProject}
          pagesPerScan={limitsFor(plan).pagesPerScan}
        />
      ) : (
        <EmptyState
          icon={FolderPlus}
          title="No project to scan yet"
          description="You need a project (a client's website) before you can run a scan."
          action={
            <ButtonLink href="/projects/new">
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              Create a project
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
