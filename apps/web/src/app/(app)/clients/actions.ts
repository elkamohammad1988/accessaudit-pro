"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { effectivePlan, formatLimit, isWithinLimit, limitsFor } from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";
import { genericWriteError } from "@/lib/errors";

export type ClientFormState = { error: string | null };

const clientSchema = z.object({
  name: z.string().trim().min(2, "Client name must be at least 2 characters.").max(80),
  contactEmail: z
    .string()
    .trim()
    .max(160)
    .email("Enter a valid contact email.")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer.").optional(),
});

const emptyToNull = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function parse(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    contactEmail: (formData.get("contactEmail") as string | null) ?? "",
    notes: (formData.get("notes") as string | null) ?? "",
  });
}

export async function createClientRecord(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
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
  if (!isWithinLimit(plan, "clients", count ?? 0)) {
    const limits = limitsFor(plan);
    return {
      error: `Your ${limits.label} plan allows ${formatLimit(limits.clients)} client(s). Archive one or upgrade to add more.`,
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organization.id,
      name: parsed.data.name,
      contact_email: emptyToNull(parsed.data.contactEmail),
      notes: emptyToNull(parsed.data.notes),
    })
    .select("id")
    .single();

  if (error) return { error: genericWriteError("createClient", error) };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing client id." };
  }
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
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

  if (error) return { error: genericWriteError("updateClient", error) };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

/** Soft delete: archived clients keep their scan history (compliance product). */
export async function archiveClientRecord(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organization.id);

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  redirect("/clients");
}

export async function restoreClientRecord(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const { supabase, organization } = await requireOrg();
  await supabase
    .from("clients")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("organization_id", organization.id);

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  redirect(`/clients/${id}`);
}
