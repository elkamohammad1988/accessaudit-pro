import type { Metadata } from "next";
import Link from "next/link";
import { limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
          className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New scan</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
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
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            You need a project (a client&apos;s website) before you can scan.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            Create a project
          </Link>
        </div>
      )}
    </div>
  );
}
