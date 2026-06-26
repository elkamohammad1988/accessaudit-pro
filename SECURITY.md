# Security

AccessAudit Pro is a multi-tenant SaaS that drives a headless browser against
user-supplied URLs and processes payments. Security is treated as a first-class
concern, not an afterthought. This document is the posture summary a technical
reviewer or acquirer should read first.

## Tenant isolation

- **Postgres Row-Level Security on every tenant table.** Access is gated by an
  `owns_org(organization_id)` helper; no client query can read or write another
  organization's rows. See `supabase/migrations/*_rls_policies.sql`.
- **Verified sessions only.** Server code resolves the user with
  `supabase.auth.getUser()` (token verified against the auth server), never the
  unverified `getSession()`. See `apps/web/src/lib/auth.ts`.
- **Service-role key is server-only.** The RLS-bypassing client is marked
  `server-only` and is used solely by the Stripe webhook, the CSV export, and the
  worker — never shipped to the browser.

## Application hardening

- **HTTP security headers + CSP** on every response (`apps/web/next.config.mjs`):
  `Content-Security-Policy` (default-src `'self'`, `frame-ancestors 'none'`,
  `img-src https:`, `connect-src 'self' https: wss:`), `Strict-Transport-Security`
  (HSTS, 2-year, preload), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and
  a restrictive `Permissions-Policy`.
- **Stored-XSS defense.** User-supplied image URLs (org logo, avatar) — rendered
  on the public share report — are validated to `https:` only at write time
  (`apps/web/src/lib/validation.ts`), with the CSP `img-src https:` as a second
  layer.
- **Open-redirect guard.** Post-auth `next` targets are sanitized to same-site
  paths, rejecting protocol-relative, backslash, and control/whitespace tricks
  (`safeNextPath`, `apps/web/src/lib/utils.ts`).
- **CSV formula-injection guard.** Exported cells beginning with `= + - @` (or
  tab/CR) are prefixed so spreadsheets treat scanned-page content as text, never
  formulas (`apps/web/src/lib/csv.ts`).
- **Account-enumeration resistance.** Auth flows return generic, non-enumerating
  messages and never echo backend error strings (`apps/web/src/app/(auth)/actions.ts`).
- **Input bounds.** Server actions validate with Zod and cap free-text inputs and
  the scan URL-list size before any work is done.

## SSRF (the scan worker)

The worker fetches arbitrary user-supplied URLs with a real Chromium, so it is the
highest-value target (it holds the service-role key). Defenses
(`apps/worker/src/url-guard.ts`, `scanner.ts`):

- **Pre-navigation validation** resolves DNS and blocks if any resolved address is
  private/loopback/link-local/CGNAT/cloud-metadata (IPv4 + IPv6, incl. IPv4-mapped).
- **Per-request interceptor** re-checks every navigation, redirect, and subresource
  — and now **resolves hostnames** (cached per scan), closing the DNS-rebinding
  gap where a hostname returns a public IP at validation time and a private IP at
  connect time.
- **Timeouts everywhere.** Navigation and the axe analysis pass are both bounded,
  so a hostile or pathological page cannot hang the worker; a heartbeat + reaper
  recovers genuinely stuck scans.

## Billing integrity

- **Webhook signature verification** on every Stripe event.
- **Idempotency ledger** (`stripe_events` table): each event id is recorded only
  after successful processing, so redeliveries are skipped and a failed handler
  (HTTP 500) is safely retried by Stripe. Subscription updates set absolute state,
  so reprocessing is harmless.
- **Bounded grace.** `past_due` keeps a paid plan during Stripe's retry window;
  once Stripe gives up (`unpaid`) access reverts to free — no indefinite free
  paid-tier usage. Entitlement is centralized in `effectivePlan()`.

## Observability

Sentry is wired for the web app (client + server + edge error boundaries) and the
worker, gated on a DSN (inert when unset). See `docs/DEPLOYMENT.md`.

## Known gaps / roadmap

These are tracked, not hidden:

- **Rate limiting** is enforced in-app via a durable Postgres fixed-window
  limiter (`rate_limits` + `check_rate_limit`, fails open) on sign-in, sign-up,
  and password-reset (per IP) and on scan creation (per org), layered on top of
  Supabase's built-in auth limits. It is intentionally coarse; a per-route
  token-bucket with burst credits is a future refinement.
- **CSP** uses `'unsafe-inline'` for scripts/styles (required by Next's inline
  bootstrap); moving to a per-request nonce is planned.
- **RLS integration tests** require a live Postgres and are not in CI yet; the
  pure security logic (SSRF classification, redirect/CSV guards, plan gating) is
  unit-tested.

## Reporting a vulnerability

Email **security@accessaudit.pro** with details and reproduction steps. Please do
not open public issues for security reports. We aim to acknowledge within 72 hours.
