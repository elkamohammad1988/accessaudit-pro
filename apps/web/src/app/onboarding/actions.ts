"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type OnboardingState = { error: string | null };

const schema = z.object({
  name: z.string().trim().min(2, "Agency name must be at least 2 characters.").max(80),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Brand color must be a hex value like #4F46E5.")
    .optional(),
});

export async function createOrganization(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    brandColor: (formData.get("brandColor") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
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
    // 23505 = unique_violation (slug taken). Anything else: log + generic.
    if (error.code !== "23505") {
      console.error("[createOrganization]", error);
      return { error: "Could not create your workspace. Please try again." };
    }
  }

  return { error: "Could not generate a unique workspace URL. Try a different name." };
}
