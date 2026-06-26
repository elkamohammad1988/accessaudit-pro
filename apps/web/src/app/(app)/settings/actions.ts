"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { optionalHttpsUrl } from "@/lib/validation";
import { genericWriteError } from "@/lib/errors";

export type SettingsState = { error: string | null; ok: boolean };

const emptyToNull = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/* ----------------------------- Profile ----------------------------------- */

const profileSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  avatarUrl: optionalHttpsUrl("Avatar URL"),
});

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = profileSchema.safeParse({
    fullName: (formData.get("fullName") as string | null) ?? "",
    avatarUrl: (formData.get("avatarUrl") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", ok: false };
  }

  const { supabase, userId } = await requireOrg();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: emptyToNull(parsed.data.fullName),
      avatar_url: emptyToNull(parsed.data.avatarUrl),
    })
    .eq("id", userId);

  if (error) return { error: genericWriteError("updateProfile", error), ok: false };

  revalidatePath("/settings");
  return { error: null, ok: true };
}

/* --------------------------- Organization -------------------------------- */

const orgSchema = z.object({
  name: z.string().trim().min(2, "Agency name must be at least 2 characters.").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Slug may contain only lowercase letters, numbers, and hyphens."),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Brand color must be a hex value like #4F46E5."),
  logoUrl: optionalHttpsUrl("Logo URL"),
});

export async function updateOrganization(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    slug: slugify((formData.get("slug") as string) || ""),
    brandColor: formData.get("brandColor"),
    logoUrl: (formData.get("logoUrl") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", ok: false };
  }

  const { supabase, organization } = await requireOrg();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      brand_color: parsed.data.brandColor,
      logo_url: emptyToNull(parsed.data.logoUrl),
    })
    .eq("id", organization.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That workspace URL is taken — choose a different slug.", ok: false };
    }
    return { error: genericWriteError("updateOrganization", error), ok: false };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}
