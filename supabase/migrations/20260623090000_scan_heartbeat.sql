-- =============================================================================
-- AccessAudit Pro — 0005 Scan heartbeat
-- The stale-scan reaper must tell a long-but-healthy multi-page scan apart from
-- a worker that crashed mid-job. `started_at` is only the claim time, so a large
-- (e.g. 500-page) scan that runs longer than the reaper threshold would be
-- falsely failed. Add a heartbeat the worker bumps after each page; the reaper
-- keys off it instead. Set it on claim so it is never null while 'running'.
-- =============================================================================

alter table public.scans
  add column if not exists last_progress_at timestamptz;

comment on column public.scans.last_progress_at is
  'Worker heartbeat: updated after each page while running. The reaper fails scans whose heartbeat is older than WORKER_STALE_SCAN_MS.';

-- Re-define claim so it also stamps the heartbeat. CREATE OR REPLACE preserves
-- the existing grants/revokes from 0004, so no need to re-grant.
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
         last_progress_at = now()
   where id = claimed.id
  returning * into claimed;

  return claimed;
end;
$$;

-- Cheap lookups for the reaper's "running and stale" sweep.
create index if not exists scans_running_progress_idx
  on public.scans (last_progress_at)
  where status = 'running';
