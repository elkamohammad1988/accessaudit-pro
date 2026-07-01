"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { getTranslations } from "@/i18n/server";

export type OnboardingState = { error: string | null };

export async function createOrganization(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const t = await getTranslations("onboarding.messages");
  const schema = z.object({
    name: z.string().trim().min(2, t("nameMin")).max(80),
    brandColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, t("brandColorHex"))
      .optional(),
  });
  const parsed = schema.safeParse({
    name: formData.get("name"),
    brandColor: (formData.get("brandColor") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // One workspace per owner in the MVP — don't create a second.
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect("/dashboard");
  }

  const base = slugify(parsed.data.name) || "agency";

  // Retry slug a couple of times on unique-violation collisions.
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${crypto.randomUUID().slice(0, 4)}`;
    const { error } = await supabase.from("organizations").insert({
      name: parsed.data.name,
      slug,
      owner_id: user.id,
      ...(parsed.data.brandColor ? { brand_color: parsed.data.brandColor } : {}),
    });

    if (!error) {
      revalidatePath("/", "layout");
      redirect("/dashboard");
    }
    // The owner already has an org (a concurrent submit won the race, now that
    // owner_id is UNIQUE). The workspace exists — just go to it.
    if (
      error.code === "23505" &&
      [error.message, error.details].some((m) => m?.includes("organizations_owner_id_key"))
    ) {
      redirect("/dashboard");
    }
    // 23505 otherwise = slug taken → retry with a suffixed slug. Anything else: log + generic.
    if (error.code !== "23505") {
      console.error("[createOrganization]", error);
      return { error: t("createFailed") };
    }
  }

  return { error: t("slugFailed") };
}
