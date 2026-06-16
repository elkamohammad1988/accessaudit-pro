-- =============================================================================
-- AccessAudit Pro — 0004 Scan queue
-- A Postgres-backed job queue (no Redis in MVP). The web app inserts a scan with
-- status='queued'; the worker calls claim_next_scan() which atomically picks the
-- oldest queued scan with FOR UPDATE SKIP LOCKED and flips it to 'running'. This
-- is safe across multiple worker instances. Worker-only: service_role.
-- =============================================================================

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
         started_at = now()
   where id = claimed.id
  returning * into claimed;

  return claimed;
end;
$$;

comment on function public.claim_next_scan() is
  'Atomically claim the oldest queued scan (FOR UPDATE SKIP LOCKED) and mark it running. Worker-only.';

-- Lock it down: only the worker (service_role) may claim jobs.
revoke all on function public.claim_next_scan() from public;
revoke all on function public.claim_next_scan() from anon;
revoke all on function public.claim_next_scan() from authenticated;
grant execute on function public.claim_next_scan() to service_role;

-- Partial index makes "oldest queued" lookups cheap as the scans table grows.
create index if not exists scans_queued_idx
  on public.scans (created_at)
  where status = 'queued';

-- Stream scan status changes to the UI (queued → running → completed). Guarded
-- so it's a no-op on stacks without the Supabase realtime publication, and
-- idempotent if scans is already published. RLS still applies to realtime.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'scans'
     )
  then
    alter publication supabase_realtime add table public.scans;
  end if;
end $$;
