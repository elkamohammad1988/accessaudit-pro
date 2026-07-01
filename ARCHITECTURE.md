# Architecture

AccessAudit Pro is a pnpm + Turborepo monorepo with a clean web/worker split and a
shared domain core. This document explains how the pieces fit and the decisions
behind them. For the data model see [`docs/ERD.md`](docs/ERD.md); for the
trim-down rationale see [`docs/DB_REVIEW.md`](docs/DB_REVIEW.md).

## System overview

```
                         ┌──────────────────────────────┐
   Browser  ───────────► │  apps/web  (Next.js 15)       │
                         │  • App Router, RSC, SSR auth  │
                         │  • Server Actions (mutations) │
                         │  • Stripe Checkout/Portal     │
                         │  • Public report  /r/[token]  │
                         └───────┬───────────────▲───────┘
                                 │ insert scan    │ realtime + poll
                                 │ (status=queued)│ (status updates)
                                 ▼                │
                         ┌──────────────────────────────┐
                         │  Supabase Postgres            │
                         │  • RLS on every tenant table  │
                         │  • claim_next_scan() RPC      │
                         │    (FOR UPDATE SKIP LOCKED)   │
                         │  • Auth, Realtime, Storage    │
                         └───────▲───────────────┬───────┘
                       claim job │               │ write pages +
                  (service role) │               │ violations
                         ┌───────┴───────────────▼───────┐
                         │  apps/worker (Node)           │
                         │  • Playwright + axe-core      │
                         │  • SSRF guard, timeouts       │
                         │  • heartbeat + reaper         │
                         └──────────────────────────────┘
```

## Why a separate worker (the key decision)

axe-core needs a fully rendered DOM, which means headless Chromium via Playwright.
That cannot run in serverless/edge functions (no bundled Chromium, long runtimes),
so the scan engine is a **dedicated, always-on Node service**. The web app stays
fast and serverless-friendly; scans run off the request path.

The queue is **Postgres-native** — no Redis. The web app inserts a `scans` row
with `status='queued'`; the worker claims jobs atomically via a
`claim_next_scan()` RPC that uses `FOR UPDATE SKIP LOCKED`, so multiple worker
replicas never double-process. A per-page heartbeat (`last_progress_at`) plus a
reaper recovers scans orphaned by a crashed worker. Results stream back to the UI
via Supabase Realtime, with polling as a fallback.

## Packages

| Package | Role |
|---|---|
| `apps/web` | Next.js 15 App Router — UI, Server Actions, route handlers, billing, public report. |
| `apps/worker` | Playwright + axe-core scan worker; queue consumer; SSRF guard. |
| `packages/shared` | The domain core — plan limits/entitlement, scoring, impact taxonomy. The single source of truth shared by web + worker. |
| `packages/database` | Generated Supabase TypeScript types. |
| `supabase/` | Migrations, RLS policies, triggers, the queue RPC, seed data. |

## Request & data flow

- **Auth/session** — `@supabase/ssr` cookies; `requireSession()`/`requireOrg()`
  resolve the user + owned org, `cache()`-deduped per request.
- **Mutations** — Server Actions follow one pattern: `requireOrg → Zod validate →
  quota check → write → revalidate`. Every write is scoped by `organization_id`.
- **Scoring** — pure, shared functions (`packages/shared/src/domain.ts`): a
  per-impact weighted penalty mapped through exponential decay to a 0–100 score,
  normalized per page for the overall scan. Deterministic and unit-tested, so the
  worker, the in-app report, and the public sample can never disagree.
- **Reports** — `load-report.ts` assembles a scan with its pages + grouped
  violations (queries parallelized); rendered by a single `ReportView` reused by
  the in-app report, the print/PDF view, and the public `/sample`.
- **Billing** — Stripe Checkout + Customer Portal; a signature-verified,
  idempotent webhook syncs the `subscriptions` row; `effectivePlan()` is the one
  gate that converts (plan, status) into the limits that actually apply.

## Frontend & design system

- Next.js 15 App Router (React 19), TypeScript, Tailwind CSS, TanStack Query.
- A token-driven design system: semantic CSS variables (`globals.css`) mapped to
  Tailwind, class-based dark mode with a no-flash inline script and a system /
  light / dark toggle, a small component kit (Button, Card, Badge, Skeleton,
  Progress), and dependency-free SVG charts.
- Accessibility is dogfooded (WCAG 2.2 AA): one consistent focus ring,
  reduced-motion support, skip links, semantic landmarks, labelled controls.

## Quality gates

`pnpm typecheck`, `pnpm lint`, `pnpm test` (79 unit tests), and `pnpm build` all
run in CI on every push/PR. The scoring, plan/billing, SSRF, CSV, and report
logic are unit-tested; see [`SECURITY.md`](SECURITY.md) for the security posture
and the test gaps that require a live database.

## Queue reliability

- `claim_next_scan` claims atomically (`FOR UPDATE SKIP LOCKED`), increments an
  `attempts` counter, and guards its UPDATE on `status='queued'`.
- Transient failures requeue and dead-letter to `failed` after
  `WORKER_MAX_ATTEMPTS`; the stale-scan reaper (keyed off the per-page heartbeat)
  requeues jobs with retries left rather than always failing them.
- `persist_scan_results` writes a scan's pages + violations in one transactional,
  idempotent delete-then-insert RPC.
- Pages within a scan run with bounded concurrency (`WORKER_SCAN_CONCURRENCY`)
  behind a crash-safe single-launch browser latch; Chromium is recycled every
  `WORKER_RECYCLE_AFTER_PAGES` pages. `/health` + `/metrics` expose queue depth,
  running scans, oldest-queued age, and recent failures.

## Scaling path

- Worker scales horizontally — `SKIP LOCKED` already supports multiple replicas.
- Planned: a `priority` sort key to honor the priority-queue plan flag, and a
  per-request nonce CSP. See the roadmap in [`README.md`](README.md).
