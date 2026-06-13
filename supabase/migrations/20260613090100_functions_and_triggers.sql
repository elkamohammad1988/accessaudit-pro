-- =============================================================================
-- AccessAudit Pro — 0002 Functions & triggers  (8-table MVP)
--   * updated_at maintenance
--   * auth.users -> profiles bootstrap
--   * organization bootstrap (free subscription only)
--   * owns_org() RLS helper (SECURITY DEFINER so it bypasses RLS and can be
--     referenced from policies without recursion)
--
-- Dropped vs v1.0: handle_new_organization's membership/usage rows,
-- has_org_role / current_org_role / shares_organization, accept_invitation().
-- Single-owner model needs exactly one helper: owns_org().
-- =============================================================================

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at      before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger trg_clients_updated_at       before update on public.clients
  for each row execute function public.set_updated_at();
create trigger trg_projects_updated_at      before update on public.projects
  for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- New auth user -> profile row
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- New organization -> free subscription
-- owner_id is set by the app to auth.uid() at insert time. The owner IS the
-- workspace; there is no membership row to create. Usage is computed on demand
-- with COUNT(*) over scans, so no counter row to open either.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (organization_id, plan, status, seats)
  values (new.id, 'free', 'active', 1)
  on conflict (organization_id) do nothing;

  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- ----------------------------------------------------------------------------
-- RLS helper: owns_org(org_id)
-- SECURITY DEFINER + fixed search_path so it reads organizations while bypassing
-- RLS. The single predicate behind every tenant policy: "do you own this org?"
-- ----------------------------------------------------------------------------
create or replace function public.owns_org(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = org_id
      and o.owner_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- Function grants
-- ----------------------------------------------------------------------------
grant execute on function public.owns_org(uuid) to authenticated;
