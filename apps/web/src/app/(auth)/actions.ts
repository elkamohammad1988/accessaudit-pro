"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";

export type AuthState = { error: string | null; message: string | null };

const credentials = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function readCredentials(formData: FormData) {
  return credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message, message: null };
  }

  revalidatePath("/", "layout");
  const dest = safeNextPath(formData.get("next") as string | null);
  // `dest` is a runtime string; cast past typedRoutes' static-route checking.
  redirect(dest as Parameters<typeof redirect>[0]);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", message: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${publicEnv.appUrl}/auth/callback` },
  });

  if (error) {
    return { error: error.message, message: null };
  }

  // When email confirmation is on, no session is returned yet.
  if (data.user && !data.session) {
    return {
      error: null,
      message: "Check your inbox to confirm your email, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) {
    return { error: "Enter a valid email address.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${publicEnv.appUrl}/auth/callback?next=/update-password`,
  });
  if (error) {
    return { error: error.message, message: null };
  }

  return {
    error: null,
    message: "If that email has an account, a reset link is on its way.",
  };
}

const newPassword = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/** Set a new password for the currently-authenticated user (post reset-link). */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = newPassword.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", message: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Request a new one.", message: null };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message, message: null };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
