# AccessAudit Pro

On-demand **WCAG 2.2 accessibility audits** for web agencies and freelancers:
enter a URL → scan → get a prioritized, WCAG-mapped report → export/share a
white-labeled deliverable.

See [`docs/PRD.md`](docs/PRD.md) for the product spec, [`docs/ERD.md`](docs/ERD.md)
for the (8-table MVP) data model, and [`docs/DB_REVIEW.md`](docs/DB_REVIEW.md) for
the architecture decisions.

## Monorepo layout

```
accessaudit-pro/
├── apps/
│   └── web/          # Next.js (App Router) — the SaaS UI + API routes
│       └── (worker/  # scan worker — Node + Playwright + axe-core — added in Phase 2)
├── packages/
│   ├── shared/       # plan limits, shared types & constants
│   └── database/     # generated Supabase types
├── supabase/         # migrations, RLS, seed, config (the database phase)
└── docs/             # PRD, ERD, DB review, database guide
```

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth +
RLS, SSR via `@supabase/ssr`) · TanStack Query · Zod · Stripe (later) · pnpm
workspaces + Turborepo.

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

# 3. App
pnpm dev                       # http://localhost:3000
```

Demo login after `db reset`: `demo@accessaudit.pro` / `Password123!`

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | run all apps in dev (Turborepo) |
| `pnpm build` | production build |
| `pnpm lint` / `pnpm typecheck` | quality gates |
| `pnpm db:reset` | re-apply migrations + seed locally |
| `pnpm db:types` | regenerate `packages/database/src/types.ts` from the local DB |

## Roadmap

Phase 0 (foundations) → Phase 1 (tenancy: orgs, clients, projects) →
**Phase 2 (scan worker — highest risk)** → Phase 3 (reports) →
Phase 4 (billing) → Phase 5 (polish & launch). See [`docs/PRD.md` §12](docs/PRD.md).
