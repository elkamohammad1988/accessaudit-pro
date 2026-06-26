-- Performance: composite + partial indexes for the list/dashboard query shapes.
--
-- The clients and projects list pages filter by organization_id, exclude archived
-- rows, and order by created_at desc. The original single-column (organization_id)
-- indexes forced an in-memory sort and scanned archived rows. These match the
-- actual access pattern so the planner can index-scan straight to the ordered,
-- active rows.

create index if not exists clients_org_created_idx
  on public.clients (organization_id, created_at desc);

create index if not exists projects_org_created_idx
  on public.projects (organization_id, created_at desc);

-- Partial indexes covering only active (non-archived) rows — the common filter on
-- both list pages and the dashboard active-client count.
create index if not exists clients_org_active_idx
  on public.clients (organization_id)
  where archived_at is null;

create index if not exists projects_org_active_idx
  on public.projects (organization_id)
  where archived_at is null;
