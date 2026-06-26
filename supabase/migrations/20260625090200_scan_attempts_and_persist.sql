-- =============================================================================
-- AccessAudit Pro — 0008 Scan attempts, dead-letter, and transactional persist
--
-- Three reliability upgrades for the worker/queue:
--   1. scans.attempts — a per-scan claim counter so a job that keeps crashing is
--      retried a bounded number of times and then dead-lettered (status='failed'),
--      instead of either retrying forever or failing on the first transient error.
--   2. claim_next_scan() bumps attempts on every claim and re-guards the UPDATE on
--      status='queued' (belt-and-suspenders on top of FOR UPDATE SKIP LOCKED).
--   3. persist_scan_results() — writes all of a scan's pages + violations in ONE
--      transaction with a delete-then-insert, so a retried persist is idempotent
--      (no half-written/duplicated results) instead of the old N+1 client inserts.
-- All worker-only (service_role).
-- =============================================================================

-- 1. Attempt counter ----------------------------------------------------------
alter table public.scans
  add column if not exists attempts int not null default 0;

comment on column public.scans.attempts is
  'Number of times the worker has claimed this scan. Bounded by WORKER_MAX_ATTEMPTS; exceeding it dead-letters the scan to failed.';

-- 2. Claim bumps attempts + guards on status ----------------------------------
-- CREATE OR REPLACE preserves the grants/revokes from migration 0004.
create or replace function public.claim_next_scan()
returns public.scans
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.scans;
begin
  select * into claimed
  from public.scans
  where status = 'queued'
  order by created_at asc
  for update skip locked
  limit 1;

  if claimed.id is null then
    return null;
  end if;

  update public.scans
     set status = 'running',
         started_at = now(),
         last_progress_at = now(),
         attempts = attempts + 1
   where id = claimed.id
     and status = 'queued'   -- atomic guard; the row is already lock-held above
  returning * into claimed;

  return claimed;
end;
$$;

-- 3. Transactional, idempotent result persistence -----------------------------
-- The worker hands the whole scan's results as a single JSONB document:
--   [ { url, status, http_status, score, totals,
--       violations: [ { rule_id, impact, wcag_criteria[], description,
--                       help_text, help_url, nodes } ] }, ... ]
-- A delete-then-insert inside the function body runs in one implicit transaction,
-- so a redelivery/retry can't leave duplicate or partial rows.
create or replace function public.persist_scan_results(
  p_scan_id uuid,
  p_org_id uuid,
  p_pages jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page      jsonb;
  v_page_id   uuid;
  v_violation jsonb;
begin
  -- Idempotency: clear any prior results for this scan. The FK cascade on
  -- violations.scan_page_id removes their violations too.
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
      insert into public.violations
        (scan_page_id, organization_id, rule_id, impact, wcag_criteria,
         description, help_text, help_url, nodes)
      values (
        v_page_id,
        p_org_id,
        v_violation ->> 'rule_id',
        (v_violation ->> 'impact')::public.impact_level,
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
end;
$$;

comment on function public.persist_scan_results(uuid, uuid, jsonb) is
  'Transactionally replace a scan''s pages + violations from a JSONB payload. Idempotent (delete-then-insert). Worker-only.';

-- Lock both functions down to the worker.
revoke all on function public.persist_scan_results(uuid, uuid, jsonb) from public;
revoke all on function public.persist_scan_results(uuid, uuid, jsonb) from anon;
revoke all on function public.persist_scan_results(uuid, uuid, jsonb) from authenticated;
grant execute on function public.persist_scan_results(uuid, uuid, jsonb) to service_role;
