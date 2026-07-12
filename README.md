<div align="center">

# AccessAudit Pro

**On-demand WCAG 2.2 accessibility audits & white-label reports for agencies.**

*Point it at any URL. Get a scored, prioritized, client-ready report — built for agencies, not just developers.*

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-79%20passing-2ea44f)](tests/)
[![Standards](https://img.shields.io/badge/WCAG-2.2%20AA-A24425)](https://www.w3.org/TR/WCAG22/)

**[▶ Live demo — accessaudit-pro.vercel.app](https://accessaudit-pro.vercel.app)** &nbsp;·&nbsp; No signup — runs on a seeded demo agency.

<img src="docs/screenshots/hero-landing.png" alt="AccessAudit Pro landing page — Gilded Charcoal identity" width="880">

</div>

---

## Why it exists

The **European Accessibility Act** is in force, and WCAG conformance has moved from a nice-to-have to a contractual requirement. Agencies now have to audit their clients' sites — but the existing tooling is built for engineers: walls of console output, no client-facing deliverable, no way to organize work across clients.

AccessAudit Pro closes that gap. An agency points it at a URL, a headless-Chromium worker runs [axe-core](https://github.com/dequelabs/axe-core) against WCAG 2.2 AA, and the result is a **scored, severity-prioritized report a client can actually read** — with plain-language fix guidance, a per-page breakdown, an executive summary with a risk grade, and a one-click white-label share link or PDF.

> Automated rules catch ~30–50% of WCAG issues. The product says so plainly on every report and frames itself as the fast first pass before manual review — not a compliance rubber stamp.

---

## Features

**Auditing**
- Headless-Chromium + axe-core scans against **WCAG 2.2 Level A / AA**
- Single-page or bulk URL-list scans, with a durable scan queue, heartbeat, and retry/attempt tracking
- Real-time scan progress (Supabase Realtime) — watch a scan go from queued → running → completed live
- Deterministic 0–100 scoring, weighted by issue impact, with severity rollups (critical / serious / moderate / minor)

**Reports & deliverables**
- Executive summary with an auto-derived **risk grade** (a single blocker = critical risk, independent of the breadth score)
- Violations grouped per axe rule, mapped to WCAG criteria, with fix guidance and affected-element detail
- Per-page scores and issue counts
- **White-label share links** (`/r/<token>`) with revoke, **PDF export**, and CSV/JSON data export
- SSRF-safe URL validation so scans can't be pointed at internal/metadata endpoints

**Agency workspace**
- Multi-tenant: organizations → clients → projects → scans, isolated by Postgres **Row-Level Security**
- Dashboard with KPI tiles, score-trend chart, severity donut, usage meters, and recent scans
- Stripe billing across four tiers with usage quotas enforced atomically in the database

**Craft**
- **Gilded Charcoal** design identity — Luxury Gold on warm charcoal, dark-first, Fraunces display over Inter — in both a dark stage and a warm-ivory day theme
- Full internationalization: **English, French, Arabic, Spanish, Chinese**, with correct **RTL** mirroring
- Accessibility held to its own standard: keyboard paths, focus states, reduced-motion support, and AA contrast throughout

---

## Plans

| Tier | Price/mo | Clients | Projects | Scans/mo | Pages/scan | White-label | Priority queue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Free** | $0 | 1 | 2 | 10 | 1 | — | — |
| **Starter** | $29 | 5 | 25 | 150 | 25 | ✓ | — |
| **Agency** | $79 | ∞ | ∞ | 750 | 100 | ✓ | ✓ |
| **Scale** | $199 | ∞ | ∞ | 3,000 | 500 | ✓ | ✓ |

Annual billing is 10× the monthly price (two months free). Limits are the single source of truth in [`packages/shared/src/plans.ts`](packages/shared/src/plans.ts).

---

## Screenshots

| Dashboard | Scan report |
| --- | --- |
| <img src="docs/screenshots/dashboard-dark.png" width="420"> | <img src="docs/screenshots/scan-report-dark.png" width="420"> |

| White-label shared report | Dashboard — day theme |
| --- | --- |
| <img src="docs/screenshots/shared-report-dark.png" width="420"> | <img src="docs/screenshots/dashboard-light.png" width="420"> |

Every route, in light and dark at portfolio aspect ratios, is captured from the live product via [`apps/web/scripts/capture.mjs`](apps/web/scripts/capture.mjs) (output kept local, outside git).

---

## Tech stack

- **Framework** — Next.js 15 (App Router, Server Actions), React 19, TypeScript (strict)
- **Styling** — Tailwind CSS 3 with a bespoke design-token layer; self-hosted Inter + Fraunces
- **Backend** — Supabase (Postgres, Auth, Row-Level Security, Realtime); 10 SQL migrations covering schema, triggers, RLS, the scan queue, atomic quota/persist RPCs, rate limiting, and Stripe event idempotency
- **Worker** — a standalone Node service (`apps/worker`) running Playwright + `@axe-core/playwright` to render pages and run the audit
- **Billing** — Stripe (Checkout, Billing Portal, webhooks with signature verification + idempotent event storage)
- **Observability** — Sentry (web + worker)
- **Tooling** — pnpm workspaces + Turborepo, Vitest (79 unit tests), Playwright (e2e), ESLint
- **Deploy** — Vercel (web), containerized worker

---

## Monorepo layout

```
accessaudit-pro/
├── apps/
│   ├── web/          Next.js app — marketing, auth, dashboard, reports, billing
│   │   ├── src/app/        route groups: (marketing) (auth) (app) (legal) + /r/[token]
│   │   ├── src/components/  design system + feature components
│   │   ├── src/lib/         scoring, report, csv, stripe, url-safety, demo store, …
│   │   ├── src/i18n/        5 locales + RTL, cookie-driven, no next-intl
│   │   └── portfolio/       generated screenshots + presentation kit
│   └── worker/       headless-Chromium + axe-core scan runner
├── packages/
│   ├── shared/       plans, domain constants, WCAG/impact levels (framework-free)
│   └── database/     generated Supabase types
├── supabase/migrations/   10 ordered SQL migrations
└── tests/            Vitest suites (scoring, plans, report, security, ssrf, stripe, …)
```

---

## Getting started

### Demo mode (zero config)

The app ships a full in-memory demo tenant, so it runs with **no backend and no environment variables**. When `NEXT_PUBLIC_SUPABASE_URL` is unset, every Supabase call is served by a local mock ([`apps/web/src/lib/demo`](apps/web/src/lib/demo)) seeded with a realistic agency (*Pixel & Pine Studio*, six clients, real WCAG findings).

```bash
pnpm install
pnpm --filter @accessaudit/web dev      # http://localhost:3000 — demo mode
```

### Full stack (real backend)

```bash
# 1. Bring up Postgres + Auth locally
supabase start
supabase db reset                        # applies all migrations
pnpm db:types                            # regenerate typed schema

# 2. Configure env (apps/web/.env.local)
#    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
#    NEXT_PUBLIC_APP_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, …

# 3. Run web + worker
pnpm dev
```

---

## Scripts & quality gates

Run from the repo root:

| Command | What it does |
| --- | --- |
| `pnpm build` | Production build of every workspace (Turborepo) |
| `pnpm typecheck` | `tsc --noEmit` across the monorepo |
| `pnpm lint` | ESLint (Next.js config) |
| `pnpm test` | Vitest — **79 unit tests** over scoring, plans, reports, security, SSRF, Stripe |
| `pnpm --filter @accessaudit/web e2e` | Playwright end-to-end flows |

The test suite covers the load-bearing business logic directly: the scoring algorithm, plan-limit/entitlement math, report grouping, executive-summary risk grading, CSV formatting, SSRF URL guards, and Stripe webhook handling.

---

## Deployment

The web app is deployed on Vercel (`accessaudit-pro.vercel.app`). Because it's a pnpm monorepo, set the Vercel **Root Directory** to `apps/web` and deploy from the repo root. The live instance runs in demo mode (no secrets), so it's a safe public showcase; point it at a real Supabase + Stripe project by adding the environment variables above.

---

## Accessibility & internationalization

A tool that audits accessibility has to hold itself to the standard it enforces. AccessAudit Pro ships with keyboard-navigable flows, visible focus states, AA-contrast tokens in both themes, `prefers-reduced-motion` support, an explicit non-zoom-blocking viewport, and semantic landmarks. It's fully translated into five languages with correct right-to-left mirroring for Arabic — the entire app, including charts and tables, flips direction.

---

## License

Proprietary — all rights reserved. Available for acquisition; contact the author.
