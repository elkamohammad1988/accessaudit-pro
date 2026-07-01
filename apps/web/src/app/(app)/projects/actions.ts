"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { effectivePlan, isWithinLimit, limitsFor, rpcQuotaLimit } from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";
import { normalizeScanUrl } from "@/lib/url-safety";
import { genericWriteError } from "@/lib/errors";
import { getTranslations } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";
import type { Translator } from "@/i18n/translate";

export type ProjectFormState = { error: string | null; upgrade?: boolean };

function projectSchema(t: Translator) {
  return z.object({
    name: z.string().trim().min(2, t("messages.nameMin")).max(80),
    clientId: z.string().uuid(t("messages.clientRequired")),
    baseUrl: z.string().trim().min(1, t("messages.urlRequired")),
  });
}

function parse(formData: FormData, t: Translator) {
  return projectSchema(t).safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    baseUrl: formData.get("baseUrl"),
  });
}

/** Confirm the client belongs to this org and is active (RLS already scopes reads). */
async function activeClientExists(
  supabase: Awaited<ReturnType<typeof requireOrg>>["supabase"],
  organizationId: string,
  clientId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .maybeSingle();
  return Boolean(data);
}

export async function createProjectRecord(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const t = await getTranslations("projects");
  const tp = await getTranslations("plans");
  const parsed = parse(formData, t);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("messages.invalidInput") };
  }
  const baseUrl = normalizeScanUrl(parsed.data.baseUrl);
  if (!baseUrl) {
    return { error: t("messages.urlInvalid") };
  }

  const { supabase, organization } = await requireOrg();

  if (!(await activeClientExists(supabase, organization.id, parsed.data.clientId))) {
    return { error: t("messages.selectValidClient") };
  }

  // Quota: only active (non-archived) projects count toward the plan limit.
  const [{ data: sub }, { count }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", organization.id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("archived_at", null),
  ]);
  const plan = effectivePlan(sub?.plan, sub?.status);
  const limits = limitsFor(plan);
  const quotaError = (): ProjectFormState => ({
    error: t("messages.quota", { plan: limits.label, limit: displayLimit(limits.projects, tp) }),
    upgrade: true,
  });
  // Friendly pre-check for the common case; the RPC below is the atomic guard.
  if (!isWithinLimit(plan, "projects", count ?? 0)) return quotaError();

  // Atomic create: counts active projects and inserts under a row lock, so two
  // concurrent requests can't both slip past the cap. NULL id ⇒ over quota.
  const { data: newId, error } = await supabase.rpc("create_project_if_within_quota", {
    p_org_id: organization.id,
    p_client_id: parsed.data.clientId,
    p_name: parsed.data.name,
    p_base_url: baseUrl,
    p_limit: rpcQuotaLimit(limits.projects),
  });
  if (error) return { error: genericWriteError("createProject", error, t("messages.saveFailed")) };
  if (!newId) return quotaError();

  revalidatePath("/projects");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${newId}`);
}

export async function updateProjectRecord(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const t = await getTranslations("projects");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: t("messages.missingId") };
  }
  const parsed = parse(formData, t);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("messages.invalidInput") };
  }
  const baseUrl = normalizeScanUrl(parsed.data.baseUrl);
  if (!baseUrl) {
    return { error: t("messages.urlInvalid") };
  }

  const { supabase, organization } = await requireOrg();

  if (!(await activeClientExists(supabase, organization.id, parsed.data.clientId))) {
    return { error: t("messages.selectValidClient") };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      client_id: parsed.data.clientId,
      name: parsed.data.name,
      base_url: baseUrl,
    })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { error: genericWriteError("updateProject", error, t("messages.saveFailed")) };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

export async function archiveProjectRecord(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) redirect(`/projects/${id}?notice=archive-failed`);

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  redirect("/projects");
}

export async function restoreProjectRecord(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) redirect(`/projects/${id}?notice=restore-failed`);

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${id}`);
}
