"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { effectivePlan, isWithinLimit, limitsFor, rpcQuotaLimit } from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";
import { genericWriteError } from "@/lib/errors";
import { getTranslations } from "@/i18n/server";
import { displayLimit } from "@/i18n/format";
import type { Translator } from "@/i18n/translate";

export type ClientFormState = { error: string | null; upgrade?: boolean };

function clientSchema(t: Translator) {
  return z.object({
    name: z.string().trim().min(2, t("messages.nameMin")).max(80),
    contactEmail: z
      .string()
      .trim()
      .max(160)
      .email(t("messages.contactEmail"))
      .optional()
      .or(z.literal("")),
    notes: z.string().trim().max(500, t("messages.notesMax")).optional(),
  });
}

const emptyToNull = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function parse(formData: FormData, t: Translator) {
  return clientSchema(t).safeParse({
    name: formData.get("name"),
    contactEmail: (formData.get("contactEmail") as string | null) ?? "",
    notes: (formData.get("notes") as string | null) ?? "",
  });
}

export async function createClientRecord(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const t = await getTranslations("clients");
  const tp = await getTranslations("plans");
  const parsed = parse(formData, t);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("messages.invalidInput") };
  }

  const { supabase, organization } = await requireOrg();

  // Quota: only active (non-archived) clients count toward the plan limit.
  const [{ data: sub }, { count }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", organization.id)
      .maybeSingle(),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("archived_at", null),
  ]);
  const plan = effectivePlan(sub?.plan, sub?.status);
  const limits = limitsFor(plan);
  const quotaError = (): ClientFormState => ({
    error: t("messages.quota", { plan: limits.label, limit: displayLimit(limits.clients, tp) }),
    upgrade: true,
  });
  // Friendly pre-check for the common case; the RPC below is the atomic guard.
  if (!isWithinLimit(plan, "clients", count ?? 0)) return quotaError();

  // Atomic create: counts active clients and inserts under a row lock, so two
  // concurrent requests can't both slip past the cap. NULL id ⇒ over quota.
  const { data: newId, error } = await supabase.rpc("create_client_if_within_quota", {
    p_org_id: organization.id,
    p_name: parsed.data.name,
    p_contact_email: emptyToNull(parsed.data.contactEmail),
    p_notes: emptyToNull(parsed.data.notes),
    p_limit: rpcQuotaLimit(limits.clients),
  });
  if (error) return { error: genericWriteError("createClient", error, t("messages.saveFailed")) };
  if (!newId) return quotaError();

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect(`/clients/${newId}`);
}

export async function updateClientRecord(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const t = await getTranslations("clients");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: t("messages.missingId") };
  }
  const parsed = parse(formData, t);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("messages.invalidInput") };
  }

  const { supabase, organization } = await requireOrg();

  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      contact_email: emptyToNull(parsed.data.contactEmail),
      notes: emptyToNull(parsed.data.notes),
    })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { error: genericWriteError("updateClient", error, t("messages.saveFailed")) };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

/** Soft delete: archived clients keep their scan history (compliance product). */
export async function archiveClientRecord(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) redirect(`/clients/${id}?notice=archive-failed`);

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  redirect("/clients");
}

export async function restoreClientRecord(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) redirect(`/clients/${id}?notice=restore-failed`);

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  redirect(`/clients/${id}`);
}
