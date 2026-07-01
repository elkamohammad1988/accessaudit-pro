-- =============================================================================
-- AccessAudit Pro — 0011 Atomic client & project quota
--
-- Brings client/project creation up to the same race-free standard as scan
-- creation (create_scan_if_within_quota, migration 0009). The previous
-- check-then-insert in the server actions let two concurrent requests each pass
-- the count check and both insert, pushing an org one or more past its plan cap.
--
-- These SECURITY DEFINER functions count the org's ACTIVE (non-archived) records
-- and insert the new row under a row lock on the org, in one transaction — so the
-- count can't change between check and insert. Each re-checks org ownership
-- against auth.uid() (the functions bypass RLS), and the project variant also
-- requires an active client in the same org. p_limit < 0 means unlimited.
-- =============================================================================

-- Clients ---------------------------------------------------------------------
create function public.create_client_if_within_quota(
  p_org_id        uuid,
  p_name          text,
  p_contact_email text,
  p_notes         text,
  p_limit         int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_count     int;
  v_client_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.organizations o
    where o.id = p_org_id and o.owner_id = v_uid
  ) then
    raise exception 'not authorized for organization' using errcode = '42501';
  end if;

  -- Serialize concurrent client creations for this org on the org row, so the
  -- count below can't change between this check and the insert.
  perform 1 from public.organizations where id = p_org_id for update;

  if p_limit >= 0 then
    select count(*) into v_count
    from public.clients
    where organization_id = p_org_id
      and archived_at is null;
    if v_count >= p_limit then
      return null;  -- over quota
    end if;
  end if;

  insert into public.clients (organization_id, name, contact_email, notes)
  values (p_org_id, p_name, p_contact_email, p_notes)
  returning id into v_client_id;

  return v_client_id;
end;
$$;

comment on function public.create_client_if_within_quota(uuid, text, text, text, int) is
  'Atomically enforce the active-client quota and insert a client. Returns the new id, or NULL when over quota. Re-checks org ownership against auth.uid().';

revoke all on function public.create_client_if_within_quota(uuid, text, text, text, int) from public;
revoke all on function public.create_client_if_within_quota(uuid, text, text, text, int) from anon;
grant execute on function public.create_client_if_within_quota(uuid, text, text, text, int) to authenticated;
grant execute on function public.create_client_if_within_quota(uuid, text, text, text, int) to service_role;

-- Projects --------------------------------------------------------------------
create function public.create_project_if_within_quota(
  p_org_id     uuid,
  p_client_id  uuid,
  p_name       text,
  p_base_url   text,
  p_limit      int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_count      int;
  v_project_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.organizations o
    where o.id = p_org_id and o.owner_id = v_uid
  ) then
    raise exception 'not authorized for organization' using errcode = '42501';
  end if;

  -- The parent client must be active and in the same org.
  if not exists (
    select 1 from public.clients c
    where c.id = p_client_id
      and c.organization_id = p_org_id
      and c.archived_at is null
  ) then
    raise exception 'invalid client' using errcode = '23514';
  end if;

  perform 1 from public.organizations where id = p_org_id for update;

  if p_limit >= 0 then
    select count(*) into v_count
    from public.projects
    where organization_id = p_org_id
      and archived_at is null;
    if v_count >= p_limit then
      return null;  -- over quota
    end if;
  end if;

  insert into public.projects (organization_id, client_id, name, base_url)
  values (p_org_id, p_client_id, p_name, p_base_url)
  returning id into v_project_id;

  return v_project_id;
end;
$$;

comment on function public.create_project_if_within_quota(uuid, uuid, text, text, int) is
  'Atomically enforce the active-project quota and insert a project. Returns the new id, or NULL when over quota. Re-checks org ownership against auth.uid() and requires an active client in the org.';

revoke all on function public.create_project_if_within_quota(uuid, uuid, text, text, int) from public;
revoke all on function public.create_project_if_within_quota(uuid, uuid, text, text, int) from anon;
grant execute on function public.create_project_if_within_quota(uuid, uuid, text, text, int) to authenticated;
grant execute on function public.create_project_if_within_quota(uuid, uuid, text, text, int) to service_role;
