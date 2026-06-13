-- =============================================================================
-- AccessAudit Pro — LOCAL DEV SEED (supabase db reset runs this after migrations)
-- -----------------------------------------------------------------------------
-- NOT for production. Creates one demo agency owner + sample data so the app
-- has something to render locally. 8-table MVP model (single owner per org).
--
-- Demo login:  demo@accessaudit.pro  /  Password123!
--
-- Assumes a recent Supabase CLI auth schema. If auth.users/auth.identities
-- columns differ in your version, adjust the two auth inserts below.
-- The handle_new_user() trigger creates the profile; handle_new_organization()
-- creates the free subscription. The owner is organizations.owner_id.
-- =============================================================================

-- Fixed UUIDs so the data is stable across resets.
-- user  11111111… / org 22222222… / clients 33.. 34.. / projects 44.. 45.. / scan 55..

-- ---- Auth user -------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'demo@accessaudit.pro',
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo Agency Owner"}'::jsonb,
  false
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@accessaudit.pro"}'::jsonb,
  'email',
  '11111111-1111-1111-1111-111111111111',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;

-- ---- Organization (trigger adds the free subscription) ---------------------
insert into public.organizations (id, name, slug, brand_color, owner_id)
values (
  '22222222-2222-2222-2222-222222222222',
  'Pixel & Pine Studio', 'pixel-and-pine', '#0EA5E9',
  '11111111-1111-1111-1111-111111111111'
)
on conflict (id) do nothing;

-- ---- Clients ---------------------------------------------------------------
insert into public.clients (id, organization_id, name, contact_email, notes)
values
  ('33333333-3333-3333-3333-333333333333',
   '22222222-2222-2222-2222-222222222222',
   'Northwind Coffee', 'web@northwindcoffee.example', 'Local coffee chain, 4-page marketing site.'),
  ('34343434-3434-3434-3434-343434343434',
   '22222222-2222-2222-2222-222222222222',
   'Acme Legal', 'it@acmelegal.example', 'Law firm; strict EAA compliance requirement.')
on conflict (id) do nothing;

-- ---- Projects --------------------------------------------------------------
insert into public.projects (id, organization_id, client_id, name, base_url)
values
  ('44444444-4444-4444-4444-444444444444',
   '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333333',
   'Northwind Marketing Site', 'https://northwindcoffee.example'),
  ('45454545-4545-4545-4545-454545454545',
   '22222222-2222-2222-2222-222222222222',
   '34343434-3434-3434-3434-343434343434',
   'Acme Legal Public Site', 'https://acmelegal.example')
on conflict (id) do nothing;

-- ---- A completed scan (publicly shared, to exercise the share link) ---------
insert into public.scans (
  id, organization_id, project_id, initiated_by, status, scan_type,
  target_urls, wcag_level, score, totals, pages_scanned,
  share_token, is_public, shared_at, started_at, finished_at
)
values (
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'completed', 'list',
  '["https://northwindcoffee.example/", "https://northwindcoffee.example/menu"]'::jsonb,
  'AA', 78.50,
  '{"critical": 2, "serious": 5, "moderate": 3, "minor": 1}'::jsonb,
  2,
  'demoshare000000000000000000000001', true, now() - interval '4 minutes',
  now() - interval '6 minutes', now() - interval '5 minutes'
)
on conflict (id) do nothing;

-- ---- Scan pages ------------------------------------------------------------
insert into public.scan_pages (id, scan_id, organization_id, url, status, http_status, score, totals)
values
  ('56565656-0001-0000-0000-000000000001',
   '55555555-5555-5555-5555-555555555555',
   '22222222-2222-2222-2222-222222222222',
   'https://northwindcoffee.example/', 'ok', 200, 74.00,
   '{"critical": 1, "serious": 3, "moderate": 2, "minor": 1}'::jsonb),
  ('56565656-0002-0000-0000-000000000002',
   '55555555-5555-5555-5555-555555555555',
   '22222222-2222-2222-2222-222222222222',
   'https://northwindcoffee.example/menu', 'ok', 200, 83.00,
   '{"critical": 1, "serious": 2, "moderate": 1, "minor": 0}'::jsonb)
on conflict (id) do nothing;

-- ---- Violations (denormalized from axe output: no wcag_rules join) ----------
insert into public.violations
  (scan_page_id, organization_id, rule_id, impact, wcag_criteria, description, help_text, nodes, help_url)
values
  ('56565656-0001-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'image-alt', 'critical', '{1.1.1}',
   'Informative <img> elements must have alt text.',
   'Add a meaningful alt attribute, or alt="" for purely decorative images.',
   '[{"target":["img.hero"],"html":"<img class=\"hero\" src=\"/hero.jpg\">","failureSummary":"Element has no alt attribute"}]'::jsonb,
   'https://dequeuniversity.com/rules/axe/4.10/image-alt'),

  ('56565656-0001-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'color-contrast', 'serious', '{1.4.3}',
   'Foreground and background colors must meet the WCAG AA contrast ratio.',
   'Increase contrast to at least 4.5:1 for normal text and 3:1 for large text.',
   '[{"target":[".btn-primary"],"html":"<a class=\"btn-primary\">Order now</a>","failureSummary":"Contrast ratio 2.9:1, expected 4.5:1"}]'::jsonb,
   'https://dequeuniversity.com/rules/axe/4.10/color-contrast'),

  ('56565656-0001-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'link-name', 'serious', '{2.4.4,4.1.2}',
   'Links must have an accessible name.',
   'Provide link text, or an aria-label, that describes the destination.',
   '[{"target":["a.icon-only"],"html":"<a class=\"icon-only\" href=\"/cart\"><svg></svg></a>","failureSummary":"Link has no discernible text"}]'::jsonb,
   'https://dequeuniversity.com/rules/axe/4.10/link-name'),

  ('56565656-0001-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'heading-order', 'moderate', '{1.3.1}',
   'Heading levels should not skip (best practice for logical structure).',
   'Order headings so levels increase by one and reflect document structure.',
   '[{"target":["h4"],"html":"<h4>Our story</h4>","failureSummary":"Heading order invalid: h4 follows h2"}]'::jsonb,
   'https://dequeuniversity.com/rules/axe/4.10/heading-order'),

  ('56565656-0002-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'label', 'critical', '{1.3.1,4.1.2}',
   'Form inputs must have an associated, programmatically determinable label.',
   'Associate a <label for> with the control, or add aria-label / aria-labelledby.',
   '[{"target":["#search"],"html":"<input id=\"search\" type=\"text\">","failureSummary":"Form element has no associated label"}]'::jsonb,
   'https://dequeuniversity.com/rules/axe/4.10/label'),

  ('56565656-0002-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'html-has-lang', 'serious', '{3.1.1}',
   'The <html> element must declare a page language.',
   'Add a lang attribute to the html element (e.g. lang="en").',
   '[{"target":["html"],"html":"<html>","failureSummary":"html element has no lang attribute"}]'::jsonb,
   'https://dequeuniversity.com/rules/axe/4.10/html-has-lang')
on conflict do nothing;
