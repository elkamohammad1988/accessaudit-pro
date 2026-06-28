-- =============================================================================
-- AccessAudit Pro — 0009 Tenant integrity, atomic persist+finalize, atomic quota
--
-- Three correctness/integrity upgrades surfaced by the production audit:
--
--   1. DB-ENFORCED TENANT ISOLATION. scan_pages/violations carry a denormalized
--      organization_id that RLS reads from. Previously nothing guaranteed it
--      matched the parent's org — a single bad arg to persist_scan_results could
--      write rows readable by the WRONG tenant. Composite FKs now make a mismatch
--      a hard constraint violation instead of a silent cross-tenant leak.
--
--   2. ATOMIC PERSIST + FINALIZE. persist_scan_results now also sets the scan's
--      terminal status/score/totals in the SAME function body (one transaction),
--      guarded on status='running' with a row lock. The worker no longer issues a
--      separate finalize() UPDATE, so a crash can't leave fresh results under a
--      'running' status (which the reaper would then requeue and re-scan). axe's
--      `impact` is coerced to the enum, so an unexpected value can't abort a whole
--      multi-page persist.
--
--   3. ATOMIC SCAN QUOTA. create_scan_if_within_quota() counts the period's scans
--      and inserts the new one under a row lock, in one transaction — closing the
--      check-then-insert race that let concurrent requests exceed the plan cap.
-- =============================================================================

-- 1. DB-enforced tenant isolation --------------------------------------------
-- Composite unique keys the child FKs can target (id is already PK; these add the
-- (id, organization_id) pair so a child can reference both at once).
alter table public.scans
  add constraint scans_id_org_key unique (id, organization_id);
alter table public.scan_pages
  add constraint scan_pages_id_org_key unique (id, organization_id);

-- A child's organization_id MUST equal its parent's. ON DELETE CASCADE mirrors the
-- existing single-column FKs (deleting a scan still removes its pages/violations).
alter table public.scan_pages
  add constraint scan_pages_scan_org_fk
  foreign key (scan_id, organization_id)
  references public.scans (id, organization_id)
  on delete cascade;

alter table public.violations
  add constraint violations_page_org_fk
  foreign key (scan_page_id, organization_id)
  references public.scan_pages (id, organization_id)
  on delete cascade;

comment on constraint scan_pages_scan_org_fk on public.scan_pages is
  'Tenant integrity: a page''s denormalized organization_id must match its scan''s.';
comment on constraint violations_page_org_fk on public.violations is
  'Tenant integrity: a violation''s denormalized organization_id must match its page''s.';

-- 2. Atomic persist + finalize ------------------------------------------------
-- Replace the 3-arg version with one that also finalizes the scan row.
drop function if exists public.persist_scan_results(uuid, uuid, jsonb);

create function public.persist_scan_results(
  p_scan_id       uuid,
  p_org_id        uuid,
  p_pages         jsonb,
  p_status        public.scan_status,
  p_score         numeric,
  p_totals        jsonb,
  p_pages_scanned int,
  p_error_reason  text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status    public.scan_status;
  v_page      jsonb;
  v_page_id   uuid;
  v_violation jsonb;
  v_impact    public.impact_level;
begin
  -- Lock the scan row and confirm it's still ours and still running. If the
  -- reaper already requeued/failed it, do nothing: a stale worker must not
  -- resurrect a scan the queue has moved on from. Lock serializes against the
  -- reaper so status can't change underneath this write.
  select status into v_status
  from public.scans
  where id = p_scan_id and organization_id = p_org_id
  for update;

  if not found or v_status is distinct from 'running' then
    return false;
  end if;

  -- Idempotency: clear any prior results for this scan (violations cascade).
  delete from public.scan_pages where scan_id = p_scan_id;

  for v_page in select * from jsonb_array_elements(coalesce(p_pages, '[]'::jsonb))
  loop
    insert into public.scan_pages
      (scan_id, organization_id, url, status, http_status, score, totals)
    values (
      p_scan_id,
      p_org_id,
      v_page ->> 'url',
      coalesce((v_page ->> 'status')::public.page_status, 'error'),
      nullif(v_page ->> 'http_status', '')::int,
      nullif(v_page ->> 'score', '')::numeric,
      coalesce(v_page -> 'totals',
               '{"critical":0,"serious":0,"moderate":0,"minor":0}'::jsonb)
    )
    returning id into v_page_id;

    for v_violation in
      select * from jsonb_array_elements(coalesce(v_page -> 'violations', '[]'::jsonb))
    loop
      -- Coerce axe's impact to the enum; an unknown value degrades to 'minor'
      -- instead of raising and rolling back the entire scan's results.
      v_impact := case lower(coalesce(v_violation ->> 'impact', ''))
        when 'critical' then 'critical'
        when 'serious'  then 'serious'
        when 'moderate' then 'moderate'
        when 'minor'    then 'minor'
        else 'minor'
      end::public.impact_level;

      insert into public.violations
        (scan_page_id, organization_id, rule_id, impact, wcag_criteria,
         description, help_text, help_url, nodes)
      values (
        v_page_id,
        p_org_id,
        v_violation ->> 'rule_id',
        v_impact,
        coalesce(
          (select array_agg(value)
             from jsonb_array_elements_text(v_violation -> 'wcag_criteria')),
          '{}'::text[]
        ),
        v_violation ->> 'description',
        v_violation ->> 'help_text',
        v_violation ->> 'help_url',
        coalesce(v_violation -> 'nodes', '[]'::jsonb)
      );
    end loop;
  end loop;

  -- Finalize the scan row in the same transaction. Guard is redundant given the
  -- lock above, but keeps intent explicit.
  update public.scans
     set status        = p_status,
         score         = p_score,
         totals        = coalesce(p_totals, totals),
         pages_scanned = coalesce(p_pages_scanned, pages_scanned),
         error_reason  = p_error_reason,
         finished_at   = now()
   where id = p_scan_id
     and status = 'running';

  return true;
end;
$$;

comment on function public.persist_scan_results(uuid, uuid, jsonb, public.scan_status, numeric, jsonb, int, text) is
  'Atomically replace a scan''s pages+violations AND finalize the scan row, guarded on status=running. Idempotent. Worker-only.';

revoke all on function public.persist_scan_results(uuid, uuid, jsonb, public.scan_status, numeric, jsonb, int, text) from public;
revoke all on function public.persist_scan_results(uuid, uuid, jsonb, public.scan_status, numeric, jsonb, int, text) from anon;
revoke all on function public.persist_scan_results(uuid, uuid, jsonb, public.scan_status, numeric, jsonb, int, text) from authenticated;
grant execute on function public.persist_scan_results(uuid, uuid, jsonb, public.scan_status, numeric, jsonb, int, text) to service_role;

-- 3. Atomic scan-quota creation ----------------------------------------------
-- Counts the period's scans and inserts the new one under a row lock, in one
-- transaction. Returns the new scan id, or NULL when the monthly cap is reached.
-- SECURITY DEFINER (bypasses RLS) so it can lock the org row, so it re-checks
-- ownership against auth.uid() itself. p_monthly_limit < 0 means unlimited.
create function public.create_scan_if_within_quota(
  p_org_id       uuid,
  p_project_id   uuid,
  p_scan_type    public.scan_type,
  p_target_urls  jsonb,
  p_wcag_level   public.wcag_level,
  p_monthly_limit int,
  p_period_start  timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_count   int;
  v_scan_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Caller must own the org and the project must be active under it.
  if not exists (
    select 1 from public.organizations o
    where o.id = p_org_id and o.owner_id = v_uid
  ) then
    raise exception 'not authorized for organization' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.projects pr
    where pr.id = p_project_id
      and pr.organization_id = p_org_id
      and pr.archived_at is null
  ) then
    raise exception 'invalid project' using errcode = '23514';
  end if;

  -- Serialize concurrent scan creations for this org on the org row.
  perform 1 from public.organizations where id = p_org_id for update;

  if p_monthly_limit >= 0 then
    select count(*) into v_count
    from public.scans
    where organization_id = p_org_id
      and created_at >= p_period_start;
    if v_count >= p_monthly_limit then
      return null;  -- over quota
    end if;
  end if;

  insert into public.scans
    (organization_id, project_id, initiated_by, status, scan_type, target_urls, wcag_level)
  values
    (p_org_id, p_project_id, v_uid, 'queued', p_scan_type, p_target_urls, p_wcag_level)
  returning id into v_scan_id;

  return v_scan_id;
end;
$$;

comment on function public.create_scan_if_within_quota(uuid, uuid, public.scan_type, jsonb, public.wcag_level, int, timestamptz) is
  'Atomically enforce the monthly scan quota and insert a queued scan. Returns the new id, or NULL when over quota. Re-checks org ownership against auth.uid().';

revoke all on function public.create_scan_if_within_quota(uuid, uuid, public.scan_type, jsonb, public.wcag_level, int, timestamptz) from public;
revoke all on function public.create_scan_if_within_quota(uuid, uuid, public.scan_type, jsonb, public.wcag_level, int, timestamptz) from anon;
grant execute on function public.create_scan_if_within_quota(uuid, uuid, public.scan_type, jsonb, public.wcag_level, int, timestamptz) to authenticated;
grant execute on function public.create_scan_if_within_quota(uuid, uuid, public.scan_type, jsonb, public.wcag_level, int, timestamptz) to service_role;
