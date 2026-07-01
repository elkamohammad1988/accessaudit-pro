# Changelog

All notable changes to AccessAudit Pro. Dates are UTC. This project follows a
phase-based pre-1.0 cadence; see [`README.md`](README.md) for the roadmap.

## Operational maturity & compliance (2026-06-29)

Closing the due-diligence gaps that aren't code: ops docs, test depth, and a
scan-authorization control. No behavior change to existing flows.

### Added
- **Enterprise CI/CD** — `ci.yml` quality gate gains an i18n-parity step + run
  cancellation; new `security.yml` (dependency audit gated on **critical** + gitleaks
  with a `.gitleaks.toml` allowlist), `codeql.yml` (SAST, `security-extended`),
  `e2e.yml` (migrations + Playwright on merge-to-main / dispatch), and `dependabot.yml`
  (grouped weekly updates). The proven build job is unchanged; no JWT-style secrets are
  committed (the e2e job reads local keys from `supabase status`). The one `high`
  advisory (`rollup`, a build-time transitive of Sentry's webpack plugin) is reported,
  not blocking — it never ships to runtime. See `docs/RELEASE_CHECKLIST.md`.
- **End-to-end test suite** — Playwright (`apps/web/e2e`): a public-route tier
  (marketing, pricing, auth, i18n, **security headers**, 404s, auth redirect) that
  runs anywhere, and an authenticated flow tier (onboarding → client → project →
  scan → report state → billing) gated on a provisioned Supabase. Excluded from the
  unit/typecheck gates so they stay fast and green.
- **Operational documentation** — [`docs/DISASTER_RECOVERY.md`](docs/DISASTER_RECOVERY.md)
  (RPO/RTO, PITR, restore & region-failure procedures, incident response, recovery
  drills), [`docs/RUNBOOKS.md`](docs/RUNBOOKS.md) (queue backlog, mass scan failures,
  webhook failures, DB pressure, rollback, GDPR erasure, security incident), and
  [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) (environments, **expand/
  contract** migration discipline, deploy order, post-deploy validation, rollback,
  upgrade strategy).
- **Scan-authorization attestation** — the new-scan form now requires the user to
  confirm they're authorized to audit the target site before a scan can start
  (browser-enforced; localized in all five languages). Reduces the legal exposure of
  scanning third-party URLs.

### Localized
- **`global-error.tsx`** — the last English-only, LTR-only surface. It now reads the
  `locale` cookie and renders the right language + `dir` (RTL for Arabic), with
  wording kept in sync with `errors.generic`. The app now has zero hardcoded
  user-facing English (verified by full sweep).

## Dependency hygiene (2026-06-29)

### Removed
- **framer-motion** — it was used only for the mobile nav drawer's slide/fade.
  Replaced with a small CSS-transition state machine (mount → enter → exit →
  unmount) that preserves every behavior: focus trap, scroll lock, focus return,
  Escape, `aria-modal`, RTL slide direction, and `prefers-reduced-motion` (via
  `motion-reduce:`). Drops a ~2.5 MB dependency (and 2 transitive packages) from
  the install and removes a third-party animation library from the authenticated
  surface — aligning with the project's deliberate minimal-motion design. (First
  Load JS was unchanged, as the library was already async-split.)

## Production-readiness review (2026-06-29)

A full top-to-bottom audit (auth/billing, worker, i18n, components, all 12
migrations). The codebase was already strong; this closed the real remaining gaps.

### Fixed
- **No silent paid→free downgrade** — the Stripe webhook mapped an unrecognized
  price id to `free`. A missing `STRIPE_PRICE_*` env var would have silently
  demoted a paying customer. It now throws on an unmapped price so Stripe retries
  and the misconfiguration is loud (and self-heals once the var is set).
- **One organization per owner is now DB-enforced** — added a `UNIQUE(owner_id)`
  constraint (migration `20260629090100`). The whole access model assumes one org
  per owner (a duplicate would break `maybeSingle()` on every authed page);
  onboarding now treats the resulting conflict as "already created" → dashboard.
- **No double-subscribe** — `startCheckout` now refuses to open a second Checkout
  for an org that already has an active subscription (it would have created a
  duplicate Stripe subscription and double-billed), and passes a Stripe
  `idempotencyKey` on customer creation so a race can't orphan a second customer.
- **Language switcher no longer sticks disabled** — the pending flag set before
  `router.refresh()` was never cleared; the trigger now re-enables once the new
  locale renders.
- **New-scan URL field no longer goes stale** — changing the project now remounts
  the single-URL input so it reflects the newly selected project's base URL
  instead of keeping the previous one.

### Hardened / cleaned
- Worker env parsing clamps numeric vars to sane floors (a `0` poll interval no
  longer busy-spins the CPU).
- Required, translated accessible labels on the score gauge and sparkline (removed
  the only two hardcoded-English fallbacks in the app).
- Share-link copy timer is cleared on unmount; sidebar focus-trap selector now
  includes `select`/`textarea`; removed dead locale-detection code and a spurious
  effect dependency in the scan realtime sync.

### Verified
- `typecheck`, `lint`, **79 tests**, `build` (40 routes, no warnings) all green.
  i18n parity check passes (5 locales in sync). All 12 migrations reviewed.

## Correctness & performance pass (2026-06-29)

A focused hardening pass surfaced by a full-codebase audit — **no new features**.

### Fixed
- **Atomic client/project quotas** — `createClientRecord` / `createProjectRecord`
  previously used a check-then-insert that two concurrent requests could both pass,
  pushing an org past its plan cap. They now call new `create_client_if_within_quota`
  / `create_project_if_within_quota` SECURITY DEFINER RPCs that count active records
  and insert under a row lock on the org, in one transaction — matching the existing
  atomic `create_scan_if_within_quota`. (migration `20260629090000`)
- **Plan-limit badges match enforcement** — the limit shown on the clients, projects
  and new-scan pages now uses `effectivePlan(plan, status)` instead of the raw stored
  plan, so a canceled/past-grace org no longer sees a stale higher cap than what's
  actually enforced.
- **RTL** — the "Most popular" pricing badge used a hardcoded `left-5`; switched to
  the logical `start-5` so it mirrors correctly in Arabic.

### Performance
- **Lazy scan-report realtime** — the Supabase Realtime client (~40 kB of WebSocket
  code) is now lazily loaded only while a scan is in progress. The far more common
  finished-report view drops from **161 kB → 124 kB** First Load JS.

### Changed
- Extracted a shared `rpcQuotaLimit()` helper (the `Infinity → -1` mapping the quota
  RPCs expect) and removed the duplicated local copy in the scan action.

### Verified
- All gates green: `typecheck`, `lint`, **79 tests**, `build` (40 routes, no warnings).

## v1.0.0-rc.1 — Release candidate (2026-06-26)

First production-quality release candidate. Scope: stability, correct local
environment loading, and release hygiene — **no new features, no redesign**.

### Fixed
- **Local environment loading** — the monorepo-root `.env.local` / `.env` is now
  loaded for **both** apps: web via `apps/web/next.config.mjs` →
  `scripts/load-env.mjs`, and the worker via `apps/worker/src/load-env.ts`
  (imported first in `index.ts`). The worker no longer crashes with
  "Missing required env var SUPABASE_URL" under `npm run dev`. Zero-dependency,
  precedence shell env > `.env.local` > `.env`; `.env.local` stays git-ignored.

### Removed
- Dead, unreferenced "coming soon" `Placeholder` component (scaffold cleanup).

### Verified (RC gate)
- All gates green: `typecheck`, `lint`, **67 tests**, `build` (38 routes). Web
  returns 200; worker `/health` → `{"status":"ok"}`; protected routes redirect to
  `/login`. Security audit confirmed: auth (`requireOrg`), org-scoped authz + RLS,
  CSP/security headers, SSRF (incl. DNS-rebinding), DB-backed rate limiting,
  Stripe-webhook signature verification, server-only service-role key, and no
  secrets committed.

## Acquisition-readiness hardening (2026-06-25)

A pass focused on product value, premium UX, and enterprise readiness.

### Added
- **Durable rate limiting** — a Postgres-backed fixed-window limiter
  (`rate_limits` table + `check_rate_limit` RPC, fails open) throttles sign-in,
  sign-up, password-reset (per IP) and scan creation (per org).
- **Reliable worker queue** — scans now carry an `attempts` counter; transient
  failures (browser/DB errors, all-pages-failed) are requeued and dead-lettered to
  `failed` after `WORKER_MAX_ATTEMPTS`. The stale-scan reaper requeues jobs with
  retries left instead of always failing them. `claim_next_scan` bumps `attempts`
  and re-guards its UPDATE on `status='queued'`.
- **Transactional, idempotent persistence** — `persist_scan_results` writes a
  scan's pages + violations in one delete-then-insert transaction, replacing the
  old N+1 client inserts; a retried scan can't leave duplicate/partial rows.
- **Bounded page concurrency** (`WORKER_SCAN_CONCURRENCY`) with a crash-safe
  single-launch browser latch, **periodic Chromium recycling**
  (`WORKER_RECYCLE_AFTER_PAGES`), and a bounded **network-idle settle** before axe.
- **Worker `/health` + `/metrics` endpoint** — queue depth, running scans,
  oldest-queued age, and recent failure count (`WORKER_HEALTH_PORT`).
- **Premium design system** — semantic design tokens, class-based dark mode with a
  no-flash system/light/dark toggle, refined shadows/radius/animations, and a
  component kit (Card, Badge, Skeleton, Progress, upgraded Button).
- **Executive dashboard** — average-score hero with a dependency-free SVG score
  trend sparkline, severity distribution bar, usage meters, and quick stats.
- **Security headers + CSP** on every response (HSTS, CSP, `X-Frame-Options`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- **Stripe webhook idempotency** via a new `stripe_events` ledger table.
- **Composite/partial indexes** for the client/project list and dashboard queries.
- **+26 unit tests** (67 total): Stripe status/price mapping, CSV
  formula-injection, SSRF DNS-rebinding, and per-scan page quota.
- `SECURITY.md`, `ARCHITECTURE.md`, and this changelog.

### Changed
- **Scoring model** — replaced the linear `100 − penalty` floor (which pinned any
  real multi-page site at 0) with bounded exponential decay, normalized per page.
  The score now stays meaningful across the whole range.
- **Worker SSRF** — the request interceptor now resolves hostnames (cached per
  scan), closing the DNS-rebinding gap; the axe analysis pass is now timeout-bound.
- **Playwright 1.49 → 1.60** with the Docker base image (`v1.60.0-noble`) realigned
  to the resolved runtime, picking up newer Chromium security fixes.
- **Billing grace** — Stripe `unpaid` now revokes to free instead of granting the
  paid tier indefinitely.
- **Performance** — `requireSession()` is `cache()`-deduped per request and the
  report loader's query waterfall is parallelized.
- All status/severity/score UI now uses theme-aware semantic tokens (correct in
  dark mode); report view, loading skeletons, marketing header, and error/404
  states rebuilt to the premium bar.

### Security
- `https:`-only validation for user-supplied image URLs (stored-XSS defense on the
  public report), open-redirect hardening, CSV formula-injection guard, scan
  URL-list size cap, and non-enumerating auth error messages.

## Phase 5 — Polish, marketing & launch prep (2026-06-25)
- Marketing surface: landing, `/pricing`, public `/sample` report, two SEO guides,
  OG image, sitemap/robots, brand favicon.
- In-app conversion: one-click upgrade on plan-limit errors; `/accessibility`
  statement; `/terms` + `/privacy`.

## Phase 4 — Billing
- Stripe Checkout + Customer Portal + webhook; server-side plan-limit enforcement.

## Phase 3 — Reports
- Score, breakdowns, violation detail with fix guidance; white-label PDF + CSV
  export; revocable public share links.

## Phase 2 — Scan engine
- Playwright + axe-core worker; Postgres queue (`FOR UPDATE SKIP LOCKED`); live
  progress via Realtime.

## Phase 1 — Tenancy
- Organizations, clients & projects CRUD, settings/branding.

## Phase 0 — Foundations
- Auth (email/password + magic link), SSR sessions, app shell, CI, schema + RLS.
