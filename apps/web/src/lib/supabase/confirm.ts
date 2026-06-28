import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (EMAIL_OTP_TYPES as readonly string[]).includes(value);
}

/**
 * Single handler for every Supabase auth redirect — email confirmation, magic
 * link, password recovery, and OAuth. It establishes a session from whichever
 * artifact Supabase sent and forwards the user to a safe `next` path.
 *
 * Two artifacts are supported:
 *   1. `token_hash` + `type` → `verifyOtp()`. This is the flow the SSR docs
 *      recommend for email links: it does NOT depend on the PKCE code-verifier
 *      cookie, so confirmation works even if the link is opened in a different
 *      browser/device than the one that signed up.
 *   2. `code` → `exchangeCodeForSession()` (PKCE / OAuth).
 *
 * When a link is expired, already used, or otherwise rejected, Supabase redirects
 * here with `?error=access_denied&error_code=otp_expired` and no token/code. We
 * detect that and send the user to /login with a recoverable state (where they
 * can request a fresh link) instead of silently dead-ending.
 */
export async function completeAuthRedirect(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));

  // 1) Supabase rejected the link upstream (expired / already used / denied).
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  if (error || errorCode) {
    const reason =
      errorCode === "otp_expired" || error === "access_denied" ? "expired_link" : "auth_callback";
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  const supabase = await createClient();

  // 2) token_hash flow (verifyOtp) — the recommended path for email links.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && isEmailOtpType(type)) {
    const { error: verifyError } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!verifyError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // The hash was invalid or already consumed — treat it like an expired link
    // so the user is offered a resend rather than a generic failure.
    return NextResponse.redirect(`${origin}/login?error=expired_link`);
  }

  // 3) PKCE code flow (OAuth, and any code-style links).
  const code = searchParams.get("code");
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  // 4) Nothing actionable on the URL.
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
