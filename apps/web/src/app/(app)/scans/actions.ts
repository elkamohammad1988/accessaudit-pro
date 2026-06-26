"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  effectivePlan,
  formatLimit,
  isWithinLimit,
  limitsFor,
  pagesWithinScanLimit,
} from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";
import { startOfMonthIso } from "@/lib/dates";
import { normalizeScanUrl } from "@/lib/url-safety";
import { genericWriteError } from "@/lib/errors";
import { allowRequest } from "@/lib/rate-limit";

export type NewScanState = { error: string | null; upgrade?: boolean };

// Cap the raw URL-list body so a huge payload can't be parsed/normalized on the
// request path (the per-plan page quota then governs how many actually run).
const MAX_URL_LIST_CHARS = 20_000;
const MAX_URL_LIST_LINES = 1_000;

const schema = z.object({
  projectId: z.string().uuid("Choose a project to scan."),
  scanType: z.enum(["single", "list"]),
  wcagLevel: z.enum(["A", "AA", "AAA"]),
  singleUrl: z.string().max(2_048).optional(),
  urlList: z.string().max(MAX_URL_LIST_CHARS, "That URL list is too large.").optional(),
});

/** Shared quota gate. Returns an error string, or null if a scan may proceed. */
async function checkScanQuota(
  supabase: Awaited<ReturnType<typeof requireOrg>>["supabase"],
  organizationId: string,
  pageCount: number,
): Promise<string | null> {
  const [{ data: sub }, { count }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", startOfMonthIso()),
  ]);
  // Effective plan: an unpaid/canceled subscription reverts to free limits.
  const plan = effectivePlan(sub?.plan, sub?.status);
  const limits = limitsFor(plan);
  if (!isWithinLimit(plan, "scansPerMonth", count ?? 0)) {
    return `You've used all ${formatLimit(limits.scansPerMonth)} scans on the ${limits.label} plan this month. Upgrade for more.`;
  }
  if (!pagesWithinScanLimit(plan, pageCount)) {
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

  // Per-org burst guard. The monthly plan quota is the real cap; this only stops
  // a script from flooding the queue faster than the worker can drain it.
  if (
    !(await allowRequest({
      action: "scan:create",
      identity: organization.id,
      max: 20,
      windowSeconds: 60,
    }))
  ) {
    return { error: "You're starting scans too quickly. Wait a moment and try again." };
  }

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
    const single = normalizeScanUrl(parsed.data.singleUrl?.trim() || project.base_url);
    if (!single) return { error: "Enter a valid URL to scan." };
    urls = [single];
  } else {
    urls = [
      ...new Set(
        (parsed.data.urlList ?? "")
          .split(/\r?\n/)
          .slice(0, MAX_URL_LIST_LINES)
          .map((line) => normalizeScanUrl(line))
          .filter((u): u is string => Boolean(u)),
      ),
    ];
    if (urls.length === 0) return { error: "Add at least one valid URL (one per line)." };
  }

  const quotaError = await checkScanQuota(supabase, organization.id, urls.length);
  if (quotaError) return { error: quotaError, upgrade: true };

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

  if (error) return { error: genericWriteError("createScan", error) };

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.id}`);
  redirect(`/scans/${data.id}`);
}

/** Re-run a scan with the same config. Limit-blocked re-scans route to billing. */
export async function rescanScan(formData: FormData): Promise<void> {
  const id = formData.get("scanId");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization, userId } = await requireOrg();

  // Same per-org burst guard as createScan — re-runs are scan creation too.
  if (
    !(await allowRequest({
      action: "scan:create",
      identity: organization.id,
      max: 20,
      windowSeconds: 60,
    }))
  ) {
    redirect(`/scans/${id}?notice=rate-limited`);
  }

  const { data: prev } = await supabase
    .from("scans")
    .select("project_id, scan_type, target_urls, wcag_level")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!prev) redirect(`/scans/${id}?notice=rescan-failed`);

  const urls = Array.isArray(prev.target_urls)
    ? prev.target_urls.filter((u): u is string => typeof u === "string")
    : [];
  if (urls.length === 0) redirect(`/scans/${id}?notice=rescan-failed`);

  const quotaError = await checkScanQuota(supabase, organization.id, urls.length);
  if (quotaError) {
    redirect("/settings/billing?status=scan-limit");
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
  if (error || !data) redirect(`/scans/${id}?notice=rescan-failed`);

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
  const { error } = makePublic
    ? await supabase
        // 256 bits from a CSPRNG, URL-safe. (UUIDs have fixed version/variant bits —
        // the wrong primitive for an unguessable, unauthenticated share token.)
        .from("scans")
        .update({
          is_public: true,
          share_token: randomBytes(32).toString("base64url"),
          shared_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", organization.id)
    : await supabase
        .from("scans")
        .update({ is_public: false, share_token: null })
        .eq("id", id)
        .eq("organization_id", organization.id);

  if (error) redirect(`/scans/${id}?notice=share-failed`);

  revalidatePath(`/scans/${id}`);
}

/** Hard-delete a scan (cascades pages + violations). Owner-only via RLS. */
export async function deleteScan(formData: FormData): Promise<void> {
  const id = formData.get("scanId");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  const { error } = await supabase
    .from("scans")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) redirect(`/scans/${id}?notice=delete-failed`);

  revalidatePath("/dashboard");
  if (typeof projectId === "string" && projectId) {
    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}`);
  }
  redirect("/dashboard");
}
