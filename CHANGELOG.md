# Changelog

All notable changes to AccessAudit Pro. Dates are UTC. This project follows a
phase-based pre-1.0 cadence; see [`README.md`](README.md) for the roadmap.

## [Unreleased] — Acquisition-readiness hardening (2026-06-25)

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
