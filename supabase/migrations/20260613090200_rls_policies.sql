-- =============================================================================
-- AccessAudit Pro — 0003 Row-Level Security  (8-table MVP)
--   * Enable RLS on every table.
--   * Single-owner isolation: a user can touch org data iff they own the org.
--       - organizations: owner_id = auth.uid()
--       - all child tables: owns_org(organization_id)
--   * No role tiers in MVP (owner does everything). RBAC returns with teams.
--   * Worker + Stripe webhook write via service_role, which BYPASSES RLS, so
--     scan_pages / violations / subscriptions have no client-facing write policy.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.organizations enable row level security;
alter table public.clients       enable row level security;
alter table public.projects      enable row level security;
alter table public.scans         enable row level security;
alter table public.scan_pages    enable row level security;
alter table public.violations    enable row level security;
alter table public.subscriptions enable row level security;

-- ----------------------------------------------------------------------------
-- profiles  (each user sees and edits only their own row)
-- ----------------------------------------------------------------------------
create policy "profiles_select_self"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- organizations  (owner-only; the row's own owner_id is the predicate)
-- ----------------------------------------------------------------------------
create policy "organizations_select_owner"
  on public.organizations for select to authenticated
  using (owner_id = auth.uid());

create policy "organizations_insert_owner"
  on public.organizations for insert to authenticated
  with check (owner_id = auth.uid());

create policy "organizations_update_owner"
  on public.organizations for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "organizations_delete_owner"
  on public.organizations for delete to authenticated
  using (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- clients  (full CRUD for the org owner)
-- ----------------------------------------------------------------------------
create policy "clients_select_owner"
  on public.clients for select to authenticated
  using (public.owns_org(organization_id));

create policy "clients_insert_owner"
  on public.clients for insert to authenticated
  with check (public.owns_org(organization_id));

create policy "clients_update_owner"
  on public.clients for update to authenticated
  using (public.owns_org(organization_id))
  with check (public.owns_org(organization_id));

create policy "clients_delete_owner"
  on public.clients for delete to authenticated
  using (public.owns_org(organization_id));

-- ----------------------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------------------
create policy "projects_select_owner"
  on public.projects for select to authenticated
  using (public.owns_org(organization_id));

create policy "projects_insert_owner"
  on public.projects for insert to authenticated
  with check (public.owns_org(organization_id));

create policy "projects_update_owner"
  on public.projects for update to authenticated
  using (public.owns_org(organization_id))
  with check (public.owns_org(organization_id));

create policy "projects_delete_owner"
  on public.projects for delete to authenticated
  using (public.owns_org(organization_id));

-- ----------------------------------------------------------------------------
-- scans  (owner creates + toggles sharing; worker mutates status/results via
-- service_role, bypassing RLS)
-- ----------------------------------------------------------------------------
create policy "scans_select_owner"
  on public.scans for select to authenticated
  using (public.owns_org(organization_id));

create policy "scans_insert_owner"
  on public.scans for insert to authenticated
  with check (public.owns_org(organization_id));

create policy "scans_update_owner"
  on public.scans for update to authenticated
  using (public.owns_org(organization_id))
  with check (public.owns_org(organization_id));

create policy "scans_delete_owner"
  on public.scans for delete to authenticated
  using (public.owns_org(organization_id));

-- ----------------------------------------------------------------------------
-- scan_pages  (read-only for the owner; written by worker via service_role)
-- ----------------------------------------------------------------------------
create policy "scan_pages_select_owner"
  on public.scan_pages for select to authenticated
  using (public.owns_org(organization_id));

-- ----------------------------------------------------------------------------
-- violations  (read-only for the owner; written by worker via service_role)
-- ----------------------------------------------------------------------------
create policy "violations_select_owner"
  on public.violations for select to authenticated
  using (public.owns_org(organization_id));

-- ----------------------------------------------------------------------------
-- subscriptions  (read-only for the owner; written by Stripe webhook/service_role)
-- ----------------------------------------------------------------------------
create policy "subscriptions_select_owner"
  on public.subscriptions for select to authenticated
  using (public.owns_org(organization_id));

-- ----------------------------------------------------------------------------
-- Role grants
-- Supabase applies default privileges to anon/authenticated/service_role on
-- public; these explicit grants make the intent self-documenting. RLS still
-- filters rows. anon is granted nothing here (public report links are resolved
-- by an Edge Function using service_role).
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
