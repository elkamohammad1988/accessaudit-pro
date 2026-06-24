









# AccessAudit Pro — Database guide

How to apply, reset, and reason about the AccessAudit Pro database. The schema
itself is documented in [`ERD.md`](./ERD.md).

> **Schema version: 8-table MVP** (single-owner model — `organ












izations.owner_id`).
> See [`DB_REVIEW.md`](./DB_REVIEW.md) for what was trimmed from the v1.0 design
> and why, and which tables return in production.

## Layout

```
supabase/
├── config.toml                              # local stack + storage buckets + auth config
├── seed.sql                                 # LOCAL-ONLY demo data (db reset runs it)
├── reference/
│   └── wcag_rules_seed.sql                  # ARCHIVED curated fix guidance (NOT applied)
└── migrations/
    ├── 20260613090000_initial_schema.sql        # 0001 extensions, enums, tables, indexes
    ├── 20260613090100_functions_and_triggers.sql# 0002 triggers + owns_org() RLS helper
    └── 20260613090200_rls_policies.sql          # 0003 enable RLS + owner policies + grants
```

Migrations apply in lexicographic filename order. The MVP denormalizes axe-core
output onto `violations`, so there is no `wcag_rules` reference table; the curated
fix guidance is preserved (un-applied) in `supabase/reference/wcag_rules_seed.sql`
for the production reintroduction of that table.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
- Docker running (for the local stack).

## Local development

```bash
# from the repo root
supabase start            # boots Postgres, Auth, Storage, Studio (see config.toml ports)
supabase db reset         # applies ALL migrations, then runs seed.sql
```

After a reset you can sign in to the local app with:

```
email:    demo@accessaudit.pro
password: Password123!
```

Studio: http://localhost:54323 · Inbucket (test emails): http://localhost:54324

## Creating a new migration

```bash
supabase migration new <name>      # creates a timestamped empty file
# edit it, then:
supabase db reset                  # re-apply from scratch (safe locally)
```

## Deploying to a hosted Supabase project

```bash
supabase link --project-ref <your-project-ref>
supabase db push                   # applies pending migrations to the linked project
```

> `seed.sql` is **not** pushed to hosted projects — it is for local resets only.
> Nor is `supabase/reference/` — it lives outside `migrations/` and is never applied.

## Generating TypeScript types (for the app phase — not yet)

```bash
supabase gen types typescript --local > packages/database/types.ts
```

## Conventions

- **Tenant key:** every tenant table has `organization_id`; RLS isolates by it.
- **Ownership:** one user owns one workspace via `organizations.owner_id`. No
  members/roles in the MVP — teams are a later additive migration.
- **Timestamps:** `created_at` everywhere; `updated_at` maintained by `set_updated_at()` on mutable tables.
- **Soft delete:** archive `clients`/`projects` via `archived_at` rather than
  hard-deleting, to protect the scan/violation history a compliance product relies on.
- **IDs:** `uuid` PKs via `gen_random_uuid()`.
- **Enums** for stable taxonomies (see ERD §4). Adding a value later requires
  a migration (`alter type … add value`).
- **Worker / Stripe webhook write with the `service_role` key** (server-side only)
  and bypass RLS. Never expose that key to the browser.
- **`violations` is denormalized from axe-core** (`rule_id`, `impact`, `wcag_criteria`,
  `description`, `help_text`, `help_url`) — no `wcag_rules` table or FK in the MVP.
- **Plan limits live in app config**, not the DB; usage is `COUNT(*)` over `scans`
  for the current month. No `usage_counters` table in the MVP.

## RLS quick reference

A user can read and write everything in an organization **iff they own it**
(`organizations.owner_id = auth.uid()`, via the `owns_org()` helper). `scan_pages`,
`violations`, and `subscriptions` are read-only to the owner; their rows are written
only by the worker / Stripe webhook through the `service_role` key (RLS bypassed).

> Role tiers (`viewer` / `member` / `admin`) return with the teams migration.

See [`ERD.md` §6](./ERD.md#6-security-model-rls) for the full policy matrix.
