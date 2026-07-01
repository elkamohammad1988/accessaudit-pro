"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  effectivePlan,
  limitsFor,
  pagesWithinScanLimit,
  rpcQuotaLimit,
  type PlanLimits,
  type PlanTier,
} from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";
import { startOfMonthIso } from "@/lib/dates";
import { normalizeScanUrl } from "@/lib/url-safety";
import { genericWriteError } from "@/lib/errors";
import { allowRequest } from "@/lib/rate-limit";
import { getTranslations } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";

export type NewScanState = { error: string | null; upgrade?: boolean };

// Cap the raw URL-list body so a huge payload can't be parsed/normalized on the
// request path (the per-plan page quota then governs how many actually run).
const MAX_URL_LIST_CHARS = 20_000;
const MAX_URL_LIST_LINES = 1_000;

/** The plan whose limits currently apply to an org (canceled/unpaid → free). */
async function planLimits(
  supabase: Awaited<ReturnType<typeof requireOrg>>["supabase"],
  organizationId: string,
): Promise<{ plan: PlanTier; limits: PlanLimits }> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const plan = effectivePlan(sub?.plan, sub?.status);
  return { plan, limits: limitsFor(plan) };
}

export async function createScan(_prev: NewScanState, formData: FormData): Promise<NewScanState> {
  const t = await getTranslations("scans.messages");
  const tp = await getTranslations("plans");

  const schema = z.object({
    projectId: z.string().uuid(t("chooseProject")),
    scanType: z.enum(["single", "list"]),
    wcagLevel: z.enum(["A", "AA", "AAA"]),
    singleUrl: z.string().max(2_048).optional(),
    urlList: z.string().max(MAX_URL_LIST_CHARS, t("urlListTooLarge")).optional(),
  });

  const parsed = schema.safeParse({
    projectId: formData.get("projectId"),
    scanType: formData.get("scanType"),
    wcagLevel: formData.get("wcagLevel"),
    singleUrl: (formData.get("singleUrl") as string | null) ?? "",
    urlList: (formData.get("urlList") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidInput") };
  }

  const { supabase, organization } = await requireOrg();

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
    return { error: t("rateLimited") };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, base_url")
    .eq("id", parsed.data.projectId)
    .eq("organization_id", organization.id)
    .is("archived_at", null)
    .maybeSingle();
  if (!project) {
    return { error: t("selectValidProject") };
  }

  let urls: string[];
  if (parsed.data.scanType === "single") {
    const single = normalizeScanUrl(parsed.data.singleUrl?.trim() || project.base_url);
    if (!single) return { error: t("enterValidUrl") };
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
    if (urls.length === 0) return { error: t("addOneUrl") };
  }

  const { plan, limits } = await planLimits(supabase, organization.id);
  // Per-scan page cap is about input size, not a race — enforce it in-app for a
  // clear message before we touch the DB.
  if (!pagesWithinScanLimit(plan, urls.length)) {
    return {
      error: t("pagesQuota", { plan: limits.label, limit: displayLimit(limits.pagesPerScan, tp) }),
      upgrade: true,
    };
  }

  // The monthly quota is enforced atomically (count + insert in one transaction)
  // so concurrent requests can't slip past the cap. NULL id ⇒ over quota.
  const { data: newScanId, error } = await supabase.rpc("create_scan_if_within_quota", {
    p_org_id: organization.id,
    p_project_id: project.id,
    p_scan_type: parsed.data.scanType,
    p_target_urls: urls,
    p_wcag_level: parsed.data.wcagLevel,
    p_monthly_limit: rpcQuotaLimit(limits.scansPerMonth),
    p_period_start: startOfMonthIso(),
  });
  if (error) return { error: genericWriteError("createScan", error, t("saveFailed")) };
  if (!newScanId) {
    return {
      error: t("scansQuota", { plan: limits.label, limit: displayLimit(limits.scansPerMonth, tp) }),
      upgrade: true,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.id}`);
  redirect(`/scans/${newScanId}`);
}

/** Re-run a scan with the same config. Limit-blocked re-scans route to billing. */
export async function rescanScan(formData: FormData): Promise<void> {
  const id = formData.get("scanId");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();

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

  const { plan, limits } = await planLimits(supabase, organization.id);
  if (!pagesWithinScanLimit(plan, urls.length)) {
    redirect("/settings/billing?status=scan-limit");
  }

  const { data: newScanId, error } = await supabase.rpc("create_scan_if_within_quota", {
    p_org_id: organization.id,
    p_project_id: prev.project_id,
    p_scan_type: prev.scan_type,
    p_target_urls: urls,
    p_wcag_level: prev.wcag_level,
    p_monthly_limit: rpcQuotaLimit(limits.scansPerMonth),
    p_period_start: startOfMonthIso(),
  });
  if (error) redirect(`/scans/${id}?notice=rescan-failed`);
  if (!newScanId) redirect("/settings/billing?status=scan-limit");

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${prev.project_id}`);
  redirect(`/scans/${newScanId}`);
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
