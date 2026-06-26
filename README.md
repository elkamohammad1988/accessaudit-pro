<div align="center">

# AccessAudit Pro

**On-demand WCAG 2.2 accessibility audits & white-label reports for agencies.**

Enter a URL → scan → get a prioritized, WCAG-mapped report → export or share a
client-ready, white-labeled deliverable.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-axe--core-2EAD33?logo=playwright&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?logo=stripe&logoColor=white)
![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-0A6CFF)

![typecheck](https://img.shields.io/badge/typecheck-passing-2EAD33)
![lint](https://img.shields.io/badge/lint-passing-2EAD33)
![build](https://img.shields.io/badge/build-passing-2EAD33)
![tests](https://img.shields.io/badge/tests-67%20passing-2EAD33)

</div>

---

## Why it exists

The European Accessibility Act (in force June 2025), ADA litigation, and Section
508 are pushing agencies to deliver accessible sites. Existing tools are either
developer-only (axe DevTools, Lighthouse — not client-presentable), enterprise-
priced (Siteimprove, Level Access), or one-off scanners with no history or client
workspaces. AccessAudit Pro fills the gap: an **affordable, agency-shaped** tool
with multi-client management, clean client-ready reports, branding, and per-org
billing. Full product spec in [`docs/PRD.md`](docs/PRD.md).

## Features

- **Multi-tenant workspaces** — organizations, clients, and projects, fully
  isolated by Postgres Row-Level Security.
- **Scan engine** — Playwright + axe-core against a fully rendered DOM, single
  page or URL list, WCAG 2.2 A/AA/AAA, off-request-path via a Postgres queue with
  live progress.
- **Meaningful scoring** — a transparent, bounded 0–100 score (exponential decay,
  per-page normalized) that stays differentiated across the whole range.
- **Client-ready reports** — score, impact & WCAG breakdowns, violation detail
  with code snippets and fix guidance, plus an honest "manual checks still
  recommended" section on every report.
- **Deliverables** — white-label PDF, CSV export, and revocable public share links.
- **Executive dashboard** — average-score trend sparkline, severity distribution,
  and usage meters.
- **Billing** — Stripe Checkout + Customer Portal, server-side plan-limit
  enforcement, idempotent webhook.
- **Premium UX** — token-driven design system, polished dark mode (system/light/
  dark), skeletons, empty/error/success states, subtle micro-interactions — and
  the product dogfoods WCAG 2.2 AA itself.
- **Marketing surface** — landing, pricing, a public live sample report, and SEO
  guides, all statically prerendered.

See the full matrix in [`docs/PRD.md` §8](docs/PRD.md) (plans) and the
[`CHANGELOG`](CHANGELOG.md).

## Monorepo layout

```
accessaudit-pro/
├── apps/
│   ├── web/          # Next.js (App Router) — SaaS UI, Server Actions, API routes
│   └── worker/       # scan worker — Node + Playwright + axe-core (queue consumer)
├── packages/
│   ├── shared/       # domain core: plan limits, entitlement, scoring, taxonomy
│   └── database/     # generated Supabase types
├── supabase/         # migrations, RLS, triggers, queue RPC, seed
└── docs/             # PRD, ERD, DB review, database guide, deployment
```

## Documentation

| Doc | What it covers |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System design, the web/worker split, data flow, scaling path. |
| [`SECURITY.md`](SECURITY.md) | Tenant isolation, headers/CSP, SSRF, billing integrity, known gaps. |
| [`docs/PRD.md`](docs/PRD.md) | Full product requirements & plans. |
| [`docs/ERD.md`](docs/ERD.md) · [`docs/DB_REVIEW.md`](docs/DB_REVIEW.md) | Data model and the architecture decisions behind the 8-table MVP. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | End-to-end go-live (Supabase + host + Railway + Stripe). |
| [`docs/PORTFOLIO.md`](docs/PORTFOLIO.md) | Showcase kit — screenshot shot-list, feature highlights, pitch. |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history. |

## Getting started

Prerequisites: **Node ≥ 20**, **pnpm 11**, and (for the local database) the
**Supabase CLI** + **Docker**.

```bash
pnpm install

# 1. Database (needs Docker running)
supabase start                 # boots local Postgres/Auth/Storage/Studio
supabase db reset              # applies migrations + seed.sql (demo data)

# 2. Env
cp .env.example .env.local     # then paste the keys printed by `supabase start`

# 3. Browser for the scan worker (one-time)
npx playwright install chromium

# 4. App + worker (Turborepo runs both; both read the root .env.local)
pnpm dev                       # web on http://localhost:3000, worker polling the queue
```

> `pnpm dev` (or `npm run dev`) starts **both** the web app and the scan worker.
> Both load env from the single root `.env.local` automatically — no need to pass
> `SUPABASE_URL=…` inline. The worker only needs Chromium (step 3) to run scans.

Demo login after `db reset`: `demo@accessaudit.pro` / `Password123!`

The web app queues scans; the **worker** runs them. Without the worker running,
scans stay `queued`. See [`apps/worker/README.md`](apps/worker/README.md) and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | run all apps in dev (Turborepo) |
| `pnpm build` | production build |
| `pnpm lint` / `pnpm typecheck` | quality gates |
| `pnpm test` | unit tests (vitest) |
| `pnpm db:reset` | re-apply migrations + seed locally |
| `pnpm db:types` | regenerate `packages/database/src/types.ts` from the local DB |

## Roadmap

- ✅ **Phase 0** — foundations (auth, app shell, SSR session).
- ✅ **Phase 1** — tenancy: organizations, clients & projects CRUD, branding.
- ✅ **Phase 2** — scan engine: Playwright + axe-core worker, Postgres queue, live progress.
- ✅ **Phase 3** — reports: score/breakdowns/violations, public share links, CSV + branded PDF.
- ✅ **Phase 4** — billing: Stripe Checkout + Portal + idempotent webhook, plan enforcement.
- ✅ **Phase 5** — polish & launch: marketing/pricing/sample, premium UX, security hardening.
- 🚧 **Phase 6** — scale & enterprise: worker concurrency + priority queue, transactional
  persistence RPC, `/health` + queue metrics, in-app rate limiting, RLS integration tests in CI.
- 🔭 **v2** — scheduled monitoring + regression alerts, scan diff/compare, API access.

Go-live is documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
