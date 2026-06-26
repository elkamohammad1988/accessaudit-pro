"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { effectivePlan, formatLimit, isWithinLimit, limitsFor } from "@accessaudit/shared";
import { requireOrg } from "@/lib/auth";
import { normalizeScanUrl } from "@/lib/url-safety";
import { genericWriteError } from "@/lib/errors";

export type ProjectFormState = { error: string | null; upgrade?: boolean };

const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters.").max(80),
  clientId: z.string().uuid("Choose a client for this project."),
  baseUrl: z.string().trim().min(1, "Enter the website URL."),
});

function parse(formData: FormData) {
  return projectSchema.safeParse({
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
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const baseUrl = normalizeScanUrl(parsed.data.baseUrl);
  if (!baseUrl) {
    return { error: "Enter a valid website URL, e.g. https://example.com." };
  }

  const { supabase, organization } = await requireOrg();

  if (!(await activeClientExists(supabase, organization.id, parsed.data.clientId))) {
    return { error: "Select a valid client." };
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
  if (!isWithinLimit(plan, "projects", count ?? 0)) {
    const limits = limitsFor(plan);
    return {
      error: `Your ${limits.label} plan allows ${formatLimit(limits.projects)} project(s). Archive one or upgrade to add more.`,
      upgrade: true,
    };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: organization.id,
      client_id: parsed.data.clientId,
      name: parsed.data.name,
      base_url: baseUrl,
    })
    .select("id")
    .single();

  if (error) return { error: genericWriteError("createProject", error) };

  revalidatePath("/projects");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectRecord(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing project id." };
  }
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const baseUrl = normalizeScanUrl(parsed.data.baseUrl);
  if (!baseUrl) {
    return { error: "Enter a valid website URL, e.g. https://example.com." };
  }

  const { supabase, organization } = await requireOrg();

  if (!(await activeClientExists(supabase, organization.id, parsed.data.clientId))) {
    return { error: "Select a valid client." };
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

  if (error) return { error: genericWriteError("updateProject", error) };

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
