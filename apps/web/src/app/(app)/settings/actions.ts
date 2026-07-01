"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { optionalHttpsUrl } from "@/lib/validation";
import { genericWriteError } from "@/lib/errors";
import { getTranslations } from "@/i18n/server";

export type SettingsState = { error: string | null; ok: boolean };

const emptyToNull = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/* ----------------------------- Profile ----------------------------------- */

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const t = await getTranslations("settings");
  const v = await getTranslations("validation");
  const avatarField = t("profile.avatarUrlLabel");

  const profileSchema = z.object({
    fullName: z
      .string()
      .trim()
      .max(120, v("tooLong", { field: t("profile.fullNameLabel") }))
      .optional(),
    avatarUrl: optionalHttpsUrl({
      tooLong: v("tooLong", { field: avatarField }),
      invalidUrl: v("invalidUrl", { field: avatarField }),
      httpsUrl: v("httpsUrl", { field: avatarField }),
    }),
  });

  const parsed = profileSchema.safeParse({
    fullName: (formData.get("fullName") as string | null) ?? "",
    avatarUrl: (formData.get("avatarUrl") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("messages.invalidInput"), ok: false };
  }

  const { supabase, userId } = await requireOrg();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: emptyToNull(parsed.data.fullName),
      avatar_url: emptyToNull(parsed.data.avatarUrl),
    })
    .eq("id", userId);

  if (error) {
    return { error: genericWriteError("updateProfile", error, t("messages.saveFailed")), ok: false };
  }

  revalidatePath("/settings");
  return { error: null, ok: true };
}

/* --------------------------- Organization -------------------------------- */

export async function updateOrganization(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const t = await getTranslations("settings");
  const v = await getTranslations("validation");
  const logoField = t("workspace.logoUrlLabel");

  const orgSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, t("messages.nameMin"))
      .max(80, v("tooLong", { field: t("workspace.nameLabel") })),
    slug: z
      .string()
      .trim()
      .min(2, t("messages.slugMin"))
      .max(48, v("tooLong", { field: t("workspace.slugLabel") }))
      .regex(/^[a-z0-9-]+$/, t("messages.slugFormat")),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t("messages.brandColorHex")),
    logoUrl: optionalHttpsUrl({
      tooLong: v("tooLong", { field: logoField }),
      invalidUrl: v("invalidUrl", { field: logoField }),
      httpsUrl: v("httpsUrl", { field: logoField }),
    }),
  });

  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    slug: slugify((formData.get("slug") as string) || ""),
    brandColor: formData.get("brandColor"),
    logoUrl: (formData.get("logoUrl") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("messages.invalidInput"), ok: false };
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
      return { error: t("messages.slugTaken"), ok: false };
    }
    return {
      error: genericWriteError("updateOrganization", error, t("messages.saveFailed")),
      ok: false,
    };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}
