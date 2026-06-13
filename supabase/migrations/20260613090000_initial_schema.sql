-- =============================================================================
-- AccessAudit Pro — 0001 Initial schema  (8-table MVP — see docs/DB_REVIEW.md)
-- Extensions, enum types, tables, constraints, and indexes.
-- Tenant root = organizations. Ownership model: ONE user owns ONE workspace
-- (organizations.owner_id). Teams/RBAC are a later additive migration.
-- Every tenant table carries organization_id; RLS isolates by it (enabled in 0003).
-- Functions/triggers in 0002.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;   -- gen_random_bytes (share tokens), crypt (dev seed)
-- gen_random_uuid() is provided by core (PG13+).

-- ----------------------------------------------------------------------------
-- Enum types (stable taxonomies). 7 enums for the MVP.
-- Dropped vs v1.0: member_role, invitation_status, violation_status, report_type
-- (teams, triage, and the reports table are postponed — see DB_REVIEW Part 3).
-- ----------------------------------------------------------------------------
create type public.scan_status          as enum ('queued', 'running', 'completed', 'failed', 'partial');
create type public.scan_type            as enum ('single', 'list');   -- no 'crawl' in MVP
create type public.wcag_level           as enum ('A', 'AA', 'AAA');
create type public.page_status          as enum ('ok', 'error');
create type public.impact_level         as enum ('critical', 'serious', 'moderate', 'minor');
create type public.plan_tier            as enum ('free', 'starter', 'agency', 'scale');
create type public.subscription_status  as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

-- ----------------------------------------------------------------------------
-- profiles  (1:1 mirror of auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'App-level user data, mirrors auth.users. Auto-created via handle_new_user() trigger.';

-- ----------------------------------------------------------------------------
-- organizations  (the agency workspace — tenant root)
-- owner_id is the single source of access: a user can touch org data iff they
-- own the org. Branding columns (logo_url, brand_color) back white-label reports.
-- ----------------------------------------------------------------------------
create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  logo_url     text,
  brand_color  text not null default '#4F46E5'
               check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.organizations is 'Agency workspace and tenant root. owner_id is the single owner; all RLS keys off it. Teams added later.';

-- ----------------------------------------------------------------------------
-- clients  (the agency's customers)
-- archived_at = soft delete; a compliance product must not hard-destroy history.
-- ----------------------------------------------------------------------------
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  contact_email    text,
  logo_url         text,
  notes            text,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.clients is 'A brand/company the agency audits for. Soft-deleted via archived_at to protect scan history.';

-- ----------------------------------------------------------------------------
-- projects  (a website/property belonging to a client)
-- crawl_config dropped — MVP scans a single page or an explicit URL list only.
-- ----------------------------------------------------------------------------
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  name             text not null,
  base_url         text not null,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.projects is 'A website (site) under a client. Soft-deleted via archived_at. No crawl config in MVP.';

-- ----------------------------------------------------------------------------
-- scans  (a single audit run)
-- Absorbs the old reports table: share_token / is_public / shared_at give one
-- public read-only link per scan. PDFs are generated on demand (no artifact row).
-- ----------------------------------------------------------------------------
create table public.scans (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  project_id       uuid not null references public.projects (id) on delete cascade,
  initiated_by     uuid references public.profiles (id) on delete set null,
  status           public.scan_status not null default 'queued',
  scan_type        public.scan_type not null default 'single',
  target_urls      jsonb not null default '[]'::jsonb,
  wcag_level       public.wcag_level not null default 'AA',
  score            numeric(5,2) check (score >= 0 and score <= 100),
  totals           jsonb not null default
                   '{"critical": 0, "serious": 0, "moderate": 0, "minor": 0}'::jsonb,
  pages_scanned    int not null default 0,
  error_reason     text,
  share_token      text unique,                       -- set when a public link is created
  is_public        boolean not null default false,
  shared_at        timestamptz,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz not null default now()
);
comment on table public.scans is 'One on-demand audit run. Written by the worker (service role). share_token/is_public make it publicly shareable; resolved via Edge Function.';

-- ----------------------------------------------------------------------------
-- scan_pages  (per-URL results within a scan)
-- screenshot_url dropped — no screenshots in MVP (storage cost, no MVP value).
-- ----------------------------------------------------------------------------
create table public.scan_pages (
  id               uuid primary key default gen_random_uuid(),
  scan_id          uuid not null references public.scans (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,  -- denormalized for RLS
  url              text not null,
  status           public.page_status not null default 'ok',
  http_status      int,
  score            numeric(5,2) check (score >= 0 and score <= 100),
  totals           jsonb not null default
                   '{"critical": 0, "serious": 0, "moderate": 0, "minor": 0}'::jsonb,
  created_at       timestamptz not null default now()
);
comment on table public.scan_pages is 'Per-page result. organization_id denormalized so RLS does not need a join through scans.';

-- ----------------------------------------------------------------------------
-- violations  (individual findings on a page)
-- Denormalized from axe-core output (no wcag_rules join): the worker writes
-- rule_id, impact, wcag_criteria, description, help_text, help_url straight from
-- axe. Curated fix guidance / the wcag_rules enrichment table return in production
-- (see supabase/reference/wcag_rules_seed.sql + DB_REVIEW Part 3).
-- ----------------------------------------------------------------------------
create table public.violations (
  id               uuid primary key default gen_random_uuid(),
  scan_page_id     uuid not null references public.scan_pages (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,  -- denormalized for RLS
  rule_id          text not null,                    -- axe rule id, e.g. 'color-contrast'
  impact           public.impact_level not null,
  wcag_criteria    text[] not null default '{}',     -- e.g. {'1.4.3'} (from axe tags)
  description      text,                              -- axe rule description
  help_text        text,                              -- axe `help` (short how-to-fix)
  help_url         text,                              -- axe `helpUrl`
  nodes            jsonb not null default '[]'::jsonb,  -- [{ target, html, failureSummary }]; cap count in worker
  created_at       timestamptz not null default now()
);
comment on table public.violations is 'A single rule failure on a page, denormalized from axe-core. No triage status in MVP.';

-- ----------------------------------------------------------------------------
-- subscriptions  (Stripe state, one per org)
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null unique references public.organizations (id) on delete cascade,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  plan                    public.plan_tier not null default 'free',
  status                  public.subscription_status not null default 'active',
  current_period_end      timestamptz,
  seats                   int not null default 1 check (seats >= 1),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
comment on table public.subscriptions is 'Billing state per organization. Written only by the Stripe webhook (service role). Plan limits live in app config; usage via COUNT(*) over scans.';

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index organizations_owner_idx       on public.organizations (owner_id);
create index clients_org_idx               on public.clients (organization_id);
create index projects_org_idx              on public.projects (organization_id);
create index projects_client_idx           on public.projects (client_id);
create index scans_project_created_idx     on public.scans (project_id, created_at desc);
create index scans_org_status_idx          on public.scans (organization_id, status);
create index scans_org_created_idx         on public.scans (organization_id, created_at desc);  -- dashboard "recent scans"
create index scan_pages_scan_idx           on public.scan_pages (scan_id);
create index scan_pages_org_idx            on public.scan_pages (organization_id);
create index violations_page_idx           on public.violations (scan_page_id);
create index violations_org_idx            on public.violations (organization_id);
-- scans.share_token + subscriptions.organization_id are already indexed by their UNIQUE constraints.
