"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formatLimit, isWithinLimit, limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";

export type NewScanState = { error: string | null };

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const schema = z.object({
  projectId: z.string().uuid("Choose a project to scan."),
  scanType: z.enum(["single", "list"]),
  wcagLevel: z.enum(["A", "AA", "AAA"]),
  singleUrl: z.string().optional(),
  urlList: z.string().optional(),
});

/** Shared quota gate. Returns an error string, or null if a scan may proceed. */
async function checkScanQuota(
  supabase: Awaited<ReturnType<typeof requireOrg>>["supabase"],
  organizationId: string,
  pageCount: number,
): Promise<string | null> {
  const [{ data: sub }, { count }] = await Promise.all([
    supabase.from("subscriptions").select("plan").eq("organization_id", organizationId).maybeSingle(),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", startOfMonthIso()),
  ]);
  const plan: PlanTier = sub?.plan ?? "free";
  const limits = limitsFor(plan);
  if (!isWithinLimit(plan, "scansPerMonth", count ?? 0)) {
    return `You've used all ${formatLimit(limits.scansPerMonth)} scans on the ${limits.label} plan this month. Upgrade for more.`;
  }
  if (pageCount > limits.pagesPerScan) {
    return `Your ${limits.label} plan allows ${formatLimit(limits.pagesPerScan)} page(s) per scan. Remove some URLs or upgrade.`;
  }
  return null;
}

export async function createScan(_prev: NewScanState, formData: FormData): Promise<NewScanState> {
  const parsed = schema.safeParse({
    projectId: formData.get("projectId"),
    scanType: formData.get("scanType"),
    wcagLevel: formData.get("wcagLevel"),
    singleUrl: (formData.get("singleUrl") as string | null) ?? "",
    urlList: (formData.get("urlList") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { supabase, organization, userId } = await requireOrg();

  const { data: project } = await supabase
    .from("projects")
    .select("id, base_url")
    .eq("id", parsed.data.projectId)
    .eq("organization_id", organization.id)
    .is("archived_at", null)
    .maybeSingle();
  if (!project) {
    return { error: "Select a valid project." };
  }

  let urls: string[];
  if (parsed.data.scanType === "single") {
    const single = normalizeUrl(parsed.data.singleUrl?.trim() || project.base_url);
    if (!single) return { error: "Enter a valid URL to scan." };
    urls = [single];
  } else {
    urls = [
      ...new Set(
        (parsed.data.urlList ?? "")
          .split(/\r?\n/)
          .map((line) => normalizeUrl(line))
          .filter((u): u is string => Boolean(u)),
      ),
    ];
    if (urls.length === 0) return { error: "Add at least one valid URL (one per line)." };
  }

  const quotaError = await checkScanQuota(supabase, organization.id, urls.length);
  if (quotaError) return { error: quotaError };

  const { data, error } = await supabase
    .from("scans")
    .insert({
      organization_id: organization.id,
      project_id: project.id,
      initiated_by: userId,
      status: "queued",
      scan_type: parsed.data.scanType,
      target_urls: urls,
      wcag_level: parsed.data.wcagLevel,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.id}`);
  redirect(`/scans/${data.id}`);
}

/** Re-run a scan with the same config. Limit-blocked re-scans route to billing. */
export async function rescanScan(formData: FormData): Promise<void> {
  const id = formData.get("scanId");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization, userId } = await requireOrg();

  const { data: prev } = await supabase
    .from("scans")
    .select("project_id, scan_type, target_urls, wcag_level")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!prev) return;

  const urls = Array.isArray(prev.target_urls)
    ? prev.target_urls.filter((u): u is string => typeof u === "string")
    : [];
  if (urls.length === 0) return;

  const quotaError = await checkScanQuota(supabase, organization.id, urls.length);
  if (quotaError) {
    redirect("/settings/billing");
  }

  const { data, error } = await supabase
    .from("scans")
    .insert({
      organization_id: organization.id,
      project_id: prev.project_id,
      initiated_by: userId,
      status: "queued",
      scan_type: prev.scan_type,
      target_urls: urls,
      wcag_level: prev.wcag_level,
    })
    .select("id")
    .single();
  if (error || !data) return;

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${prev.project_id}`);
  redirect(`/scans/${data.id}`);
}

/**
 * Toggle a public, read-only share link for a scan. Enabling mints a fresh token
 * (revoking the previous link); disabling clears the token so old URLs 404.
 */
export async function setScanShare(formData: FormData): Promise<void> {
  const id = formData.get("scanId");
  const makePublic = formData.get("share") === "on";
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  if (makePublic) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await supabase
      .from("scans")
      .update({ is_public: true, share_token: token, shared_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", organization.id);
  } else {
    await supabase
      .from("scans")
      .update({ is_public: false, share_token: null })
      .eq("id", id)
      .eq("organization_id", organization.id);
  }

  revalidatePath(`/scans/${id}`);
}

/** Hard-delete a scan (cascades pages + violations). Owner-only via RLS. */
export async function deleteScan(formData: FormData): Promise<void> {
  const id = formData.get("scanId");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  await supabase.from("scans").delete().eq("id", id).eq("organization_id", organization.id);

  revalidatePath("/dashboard");
  if (typeof projectId === "string" && projectId) {
    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}`);
  }
  redirect("/dashboard");
}
