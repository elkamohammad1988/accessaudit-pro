-- =============================================================================
-- AccessAudit Pro — 0012 One organization per owner (DB-enforced invariant)
--
-- The whole access model assumes a single org per owner (requireSession /
-- requireOrg resolve it with `.eq("owner_id", uid).maybeSingle()` — TWO rows
-- would make maybeSingle() error and break every authed page). Onboarding
-- check-then-inserts, which two concurrent submits could both pass, creating a
-- duplicate. A UNIQUE constraint makes the invariant a hard guarantee; the
-- onboarding action now treats the resulting 23505 as "someone already created
-- it" and routes to the dashboard.
--
-- The unique constraint creates its own index on (owner_id), so the existing
-- plain btree index becomes redundant and is dropped.
-- =============================================================================

alter table public.organizations
  add constraint organizations_owner_id_key unique (owner_id);

comment on constraint organizations_owner_id_key on public.organizations is
  'Single-owner MVP invariant: at most one organization per owner_id.';

drop index if exists public.organizations_owner_idx;
