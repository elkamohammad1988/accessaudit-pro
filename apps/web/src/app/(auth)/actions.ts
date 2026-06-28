"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { appBaseUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";
import { allowByIp } from "@/lib/rate-limit";

export type AuthState = { error: string | null; message: string | null };

const TOO_MANY = "Too many attempts. Please wait a minute and try again.";

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

  // Throttle password guessing per source IP before touching the auth server.
  if (!(await allowByIp("auth:signin", { max: 10, windowSeconds: 60, failClosed: true }))) {
    return { error: TOO_MANY, message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Server-side observability only (never reaches the client). The user-facing
    // copy below stays generic and non-enumerating.
    console.error("[auth] signIn failed", {
      code: (error as { code?: string }).code,
      status: (error as { status?: number }).status,
    });
    // Generic, non-enumerating message — never reveal whether the email exists
    // or echo a backend error string.
    return { error: "Incorrect email or password.", message: null };
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

  // Cap sign-ups per IP to blunt automated account creation / email-bombing.
  if (!(await allowByIp("auth:signup", { max: 5, windowSeconds: 60, failClosed: true }))) {
    return { error: TOO_MANY, message: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    // The confirmation email links to /auth/confirm with a token_hash (see the
    // email templates). This `emailRedirectTo` must be an allow-listed Redirect
    // URL in the Supabase dashboard.
    options: { emailRedirectTo: `${appBaseUrl()}/auth/confirm` },
  });

  if (error) {
    // Server-side observability only (never reaches the client).
    console.error("[auth] signUp failed", {
      code: (error as { code?: string }).code,
      status: (error as { status?: number }).status,
    });
    // Don't echo backend specifics (e.g. "User already registered") — that's an
    // account-enumeration oracle. Keep it generic.
    return {
      error: "We couldn't create that account. Try a different email, or sign in.",
      message: null,
    };
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

/**
 * Re-send the signup confirmation email. Surfaced on /login when a confirmation
 * link has expired or was already used (`?error=expired_link`). Always returns
 * the same neutral copy so it can't be used to probe which emails have accounts.
 */
export async function resendConfirmation(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) {
    return { error: "Enter a valid email address.", message: null };
  }

  const neutral: AuthState = {
    error: null,
    message: "If that email needs confirming, a fresh link is on its way.",
  };

  // Throttle to blunt inbox spam; still return the neutral copy on the limit.
  if (!(await allowByIp("auth:resend", { max: 3, windowSeconds: 300, failClosed: true }))) {
    return neutral;
  }

  const supabase = await createClient();
  // A no-op for already-confirmed or unknown emails — Supabase does not error,
  // which keeps this from being an account-enumeration oracle.
  await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: { emailRedirectTo: `${appBaseUrl()}/auth/confirm` },
  });

  return neutral;
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) {
    return { error: "Enter a valid email address.", message: null };
  }

  // Throttle reset emails per IP (prevents using us to spam a victim's inbox).
  // Still returns the same neutral copy on the limit so it isn't an oracle.
  if (!(await allowByIp("auth:reset", { max: 5, windowSeconds: 300, failClosed: true }))) {
    return {
      error: null,
      message: "If that email has an account, a reset link is on its way.",
    };
  }

  const supabase = await createClient();
  // Always return the same neutral message regardless of whether the email exists
  // or the call errored — never confirm account existence (enumeration guard).
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${appBaseUrl()}/auth/confirm?next=/update-password`,
  });

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
    return {
      error: "Couldn't update your password. Request a new reset link and try again.",
      message: null,
    };
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
