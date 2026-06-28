# Auth setup — Supabase email confirmation

This project uses `@supabase/ssr`, which authenticates with the **PKCE flow**.
The single most important consequence: **you cannot use Supabase's default email
templates.** The default templates link to `{{ .ConfirmationURL }}`, which routes
through Supabase's hosted `/auth/v1/verify` endpoint. That endpoint is
incompatible with PKCE and fails with:

```
/auth/callback?error=access_denied&error_code=otp_expired
```

The fix is to send a **`token_hash`** link to the app's own `/auth/confirm`
route, which calls `supabase.auth.verifyOtp()`. That code is already in place
(`apps/web/src/lib/supabase/confirm.ts`). What remains is configuring the
Supabase project to send the right links.

> The local `supabase/config.toml` is already configured (Site URL, Redirect
> URLs, and the `token_hash` email templates under `supabase/templates/`). If you
> run a **hosted** project (`*.supabase.co`, as in `.env.local`), `config.toml`
> does **not** apply — you must mirror the settings in the dashboard below.

---

## Hosted dashboard checklist (project `*.supabase.co`)

### 1. URL Configuration — Authentication → URL Configuration
- **Site URL:** `http://localhost:3000`
- **Redirect URLs** (add all):
  - `http://localhost:3000/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`

  (Add your production origin too when you deploy.)

### 2. Email templates — Authentication → Emails → Templates
Replace the body of each template. The exact HTML lives in `supabase/templates/`.

**Confirm signup** → paste `supabase/templates/confirmation.html`. Key line:
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">Confirm your email</a>
```

**Reset password** → paste `supabase/templates/recovery.html`. Key line:
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password">Reset your password</a>
```

**Magic Link** (optional) → paste `supabase/templates/magic_link.html` (`type=magiclink`).

> ⚠️ Do **not** leave any of these as `{{ .ConfirmationURL }}` — that is the bug.

### 3. Email provider — Authentication → Providers → Email
- **Confirm email:** ON (this is the flow we're fixing). For a faster local dev
  loop you *may* turn it OFF temporarily — signup then returns a session
  immediately and skips email entirely.
- **Secure email change:** ON (matches `double_confirm_changes`).

### 4. Token expiry — Authentication → Providers → Email
- **Email OTP Expiration:** `3600` (1 hour). Long enough to click a fresh link,
  within Supabase's recommended ≤ 1h.

### 5. Built-in email rate limits
The hosted **built-in** email service is heavily rate-limited (a few messages
per hour). If confirmation emails stop arriving while testing, that's the cause
— wait, or configure a real SMTP provider under **Project Settings → Auth →
SMTP**. (Local dev via `supabase start` has no such limit — see below.)

---

## Local Supabase (`supabase start`) — no email setup needed

`config.toml` already wires the `token_hash` templates and points Site URL at
`http://localhost:3000`. Confirmation emails are caught by **Inbucket** at
<http://localhost:54324> — open it, click the confirmation link, and you're in.
To use it, point `.env.local` at the local stack:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_URL=http://localhost:54321
# keys printed by `supabase start`
```

---

## How the flow works (after setup)

1. **Sign up** → `signUp()` calls `supabase.auth.signUp({ emailRedirectTo: ".../auth/confirm" })`.
   Email confirmation is on, so no session yet → "check your inbox" message.
2. **Confirmation email** → links to `/auth/confirm?token_hash=…&type=email&next=/dashboard`.
3. **Click link** → `completeAuthRedirect()` runs `verifyOtp({ type, token_hash })`,
   which sets the session cookies, then redirects to `/dashboard`.
4. **Expired / reused link** → Supabase (or `verifyOtp`) reports it; the user is
   sent to `/login?error=expired_link`, which shows a **Resend confirmation link**
   form (`resendConfirmation` action).
5. **Sign in / sign out / password reset** all share the same `/auth/confirm`
   handler for the recovery link.
