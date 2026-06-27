-- =============================================================================
-- AccessAudit Pro — ARCHIVED reference data: wcag_rules (NOT applied in MVP)
-- -----------------------------------------------------------------------------
-- This file is intentionally OUTSIDE supabase/migrations/, so `supabase db reset`
-- does NOT run it. It is preserved curated content, not an active migration.
--
-- Why it is here: the 8-table MVP (see docs/DB_REVIEW.md, decision A) DROPS the
-- `wcag_rules` table and instead denormalizes axe-core output (rule_id, impact,
-- wcag_criteria, description, help_text, help_url) directly onto `violations`.
-- axe-core already returns `help`, `helpUrl`, `description` and the WCAG tags.
--
-- The one thing axe does NOT give you is the hand-written, plain-language
-- `fix_guidance` below — that curated guidance is a product differentiator, so
-- it is kept here for the production reintroduction of `wcag_rules` as an
-- enrichment table (DB_REVIEW Part 3).
--
-- This file is now SELF-CONTAINED: the DDL below recreates the table (and the
-- `wcag_level` / `impact_level` enums, if missing) idempotently, so you can run
-- the whole file on its own — in the Supabase SQL editor or as a future
-- migration — without first hand-applying any schema. Step 3 of reintroduction
-- remains: join violations.rule_id -> wcag_rules.rule_id for curated guidance.
--
-- 50 axe rules mapped to WCAG 2.2 criteria. help_url -> Deque University (axe 4.10).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Schema (idempotent). The two enums already exist in the 8-table MVP initial
-- schema; the guarded blocks below only create them when this file is run
-- standalone against a database that does not yet have those migrations.
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.wcag_level as enum ('A', 'AA', 'AAA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.impact_level as enum ('critical', 'serious', 'moderate', 'minor');
exception when duplicate_object then null;
end $$;

create table if not exists public.wcag_rules (
  rule_id        text primary key,                 -- axe rule id, joins violations.rule_id
  title          text not null,
  description    text,
  wcag_criteria  text[] not null default '{}',     -- e.g. {1.4.3} (WCAG 2.2 success criteria)
  wcag_level     public.wcag_level not null,
  default_impact public.impact_level not null,     -- axe's typical impact for this rule
  fix_guidance   text,                             -- curated, plain-language remediation (the differentiator)
  help_url       text,                             -- Deque University reference
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.wcag_rules is 'Curated WCAG/axe rule enrichment (fix_guidance is hand-written). Global reference data; join violations.rule_id -> wcag_rules.rule_id.';

-- updated_at maintenance: reuse set_updated_at() when it exists (it ships with
-- the MVP functions migration). The seed's ON CONFLICT also sets updated_at
-- explicitly, so the trigger is a belt-and-braces for other writers.
do $$ begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) and not exists (
    select 1 from pg_trigger where tgname = 'trg_wcag_rules_updated_at'
  ) then
    create trigger trg_wcag_rules_updated_at before update on public.wcag_rules
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed data
-- ----------------------------------------------------------------------------
insert into public.wcag_rules
  (rule_id, title, description, wcag_criteria, wcag_level, default_impact, fix_guidance, help_url)
values
  ('area-alt', 'Image map area must have alternative text',
   'Active <area> elements in an image map must have alternative text.',
   '{1.1.1,2.4.4,4.1.2}', 'A', 'critical',
   'Add an alt attribute describing the link destination to each active area element.',
   'https://dequeuniversity.com/rules/axe/4.10/area-alt'),

  ('aria-allowed-attr', 'ARIA attributes must be allowed for an element role',
   'Elements must only use ARIA attributes permitted for their role.',
   '{4.1.2}', 'A', 'serious',
   'Remove ARIA attributes that are not allowed for the element role, or change the role.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-allowed-attr'),

  ('aria-command-name', 'ARIA commands must have an accessible name',
   'Elements with button, link, or menuitem roles must have an accessible name.',
   '{4.1.2}', 'A', 'serious',
   'Provide visible text, aria-label, or aria-labelledby so the command has a name.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-command-name'),

  ('aria-hidden-body', 'aria-hidden must not be on the document body',
   'The document body must not have aria-hidden="true".',
   '{4.1.2}', 'A', 'critical',
   'Remove aria-hidden="true" from the body element so assistive tech can read the page.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-hidden-body'),

  ('aria-hidden-focus', 'aria-hidden elements must not contain focusable elements',
   'Elements with aria-hidden="true" must not contain focusable descendants.',
   '{1.3.1,4.1.2}', 'A', 'serious',
   'Remove aria-hidden, or make the contained elements non-focusable (e.g. tabindex="-1").',
   'https://dequeuniversity.com/rules/axe/4.10/aria-hidden-focus'),

  ('aria-input-field-name', 'ARIA input fields must have an accessible name',
   'Elements with an ARIA input field role must have an accessible name.',
   '{4.1.2}', 'A', 'serious',
   'Add aria-label or aria-labelledby, or associate a visible <label>.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-input-field-name'),

  ('aria-required-attr', 'Required ARIA attributes must be provided',
   'Elements with an ARIA role must have all required ARIA attributes.',
   '{4.1.2}', 'A', 'critical',
   'Add the ARIA attributes required by the element role (see the role spec).',
   'https://dequeuniversity.com/rules/axe/4.10/aria-required-attr'),

  ('aria-required-children', 'Certain ARIA roles must contain particular children',
   'Some ARIA roles must contain specific child roles.',
   '{1.3.1}', 'A', 'critical',
   'Ensure the element contains the child roles required by its role (e.g. listitem within list).',
   'https://dequeuniversity.com/rules/axe/4.10/aria-required-children'),

  ('aria-required-parent', 'Certain ARIA roles must be contained by particular parents',
   'Some ARIA roles must be contained by a specific parent role.',
   '{1.3.1}', 'A', 'critical',
   'Place the element inside the parent role required by its role.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-required-parent'),

  ('aria-roles', 'ARIA roles must be valid',
   'Elements must use valid, non-abstract ARIA role values.',
   '{4.1.2}', 'A', 'serious',
   'Use a valid ARIA role from the spec, or remove the invalid role attribute.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-roles'),

  ('aria-toggle-field-name', 'ARIA toggle fields must have an accessible name',
   'Checkbox, radio, switch, and similar toggle roles must have an accessible name.',
   '{4.1.2}', 'A', 'serious',
   'Provide aria-label, aria-labelledby, or an associated visible label.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-toggle-field-name'),

  ('aria-valid-attr-value', 'ARIA attributes must have valid values',
   'ARIA attribute values must be valid.',
   '{4.1.2}', 'A', 'critical',
   'Correct the ARIA attribute value to a valid token or id reference.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-valid-attr-value'),

  ('aria-valid-attr', 'ARIA attribute names must be valid',
   'ARIA attributes must use valid, correctly spelled names.',
   '{4.1.2}', 'A', 'critical',
   'Fix misspelled or non-existent aria-* attribute names.',
   'https://dequeuniversity.com/rules/axe/4.10/aria-valid-attr'),

  ('button-name', 'Buttons must have discernible text',
   'Buttons must have an accessible name.',
   '{4.1.2}', 'A', 'critical',
   'Add visible text inside the button, or an aria-label / aria-labelledby.',
   'https://dequeuniversity.com/rules/axe/4.10/button-name'),

  ('bypass', 'Page must have means to bypass repeated blocks',
   'A skip link, landmark, or heading must let users bypass repeated content.',
   '{2.4.1}', 'A', 'serious',
   'Add a skip-to-content link and use landmark regions and headings.',
   'https://dequeuniversity.com/rules/axe/4.10/bypass'),

  ('color-contrast', 'Text must have sufficient color contrast',
   'Foreground and background colors must meet the WCAG AA contrast ratio.',
   '{1.4.3}', 'AA', 'serious',
   'Increase contrast to at least 4.5:1 for normal text and 3:1 for large text.',
   'https://dequeuniversity.com/rules/axe/4.10/color-contrast'),

  ('definition-list', 'Definition lists must be structured correctly',
   '<dl> elements must contain only properly ordered <dt>/<dd> groups.',
   '{1.3.1}', 'A', 'serious',
   'Ensure dl contains only dt and dd elements in valid order.',
   'https://dequeuniversity.com/rules/axe/4.10/definition-list'),

  ('dlitem', 'dt and dd must be contained by a dl',
   'Definition list items must have a <dl> parent.',
   '{1.3.1}', 'A', 'serious',
   'Wrap dt and dd elements in a parent dl element.',
   'https://dequeuniversity.com/rules/axe/4.10/dlitem'),

  ('document-title', 'Documents must have a title',
   'The page must have a non-empty <title>.',
   '{2.4.2}', 'A', 'serious',
   'Add a descriptive, unique <title> element in the document head.',
   'https://dequeuniversity.com/rules/axe/4.10/document-title'),

  ('duplicate-id-aria', 'ARIA id references must be unique',
   'ids used by ARIA and labels must be unique on the page.',
   '{4.1.2}', 'A', 'critical',
   'Make every id referenced by ARIA attributes unique within the document.',
   'https://dequeuniversity.com/rules/axe/4.10/duplicate-id-aria'),

  ('form-field-multiple-labels', 'Form fields must not have multiple label elements',
   'A form field should be referenced by a single label.',
   '{3.3.2}', 'A', 'moderate',
   'Associate each form control with exactly one label element.',
   'https://dequeuniversity.com/rules/axe/4.10/form-field-multiple-labels'),

  ('frame-title', 'Frames must have an accessible name',
   '<iframe> and <frame> elements must have a title attribute.',
   '{2.4.1,4.1.2}', 'A', 'serious',
   'Add a descriptive title attribute to each frame and iframe.',
   'https://dequeuniversity.com/rules/axe/4.10/frame-title'),

  ('heading-order', 'Heading levels should increase by one',
   'Heading levels should not skip (best practice for logical structure).',
   '{1.3.1}', 'A', 'moderate',
   'Order headings so levels increase by one and reflect document structure.',
   'https://dequeuniversity.com/rules/axe/4.10/heading-order'),

  ('html-has-lang', 'html element must have a lang attribute',
   'The <html> element must declare a page language.',
   '{3.1.1}', 'A', 'serious',
   'Add a lang attribute to the html element (e.g. lang="en").',
   'https://dequeuniversity.com/rules/axe/4.10/html-has-lang'),

  ('html-lang-valid', 'html lang attribute must be valid',
   'The lang value on <html> must be a valid language code.',
   '{3.1.1}', 'A', 'serious',
   'Use a valid BCP 47 language tag for the html lang attribute.',
   'https://dequeuniversity.com/rules/axe/4.10/html-lang-valid'),

  ('image-alt', 'Images must have alternative text',
   'Informative <img> elements must have alt text.',
   '{1.1.1}', 'A', 'critical',
   'Add a meaningful alt attribute, or alt="" for purely decorative images.',
   'https://dequeuniversity.com/rules/axe/4.10/image-alt'),

  ('input-button-name', 'Input buttons must have discernible text',
   'Button inputs must have an accessible name.',
   '{4.1.2}', 'A', 'critical',
   'Set a value attribute (or aria-label) on input type=button/submit/reset.',
   'https://dequeuniversity.com/rules/axe/4.10/input-button-name'),

  ('input-image-alt', 'Image buttons must have alternative text',
   '<input type="image"> must have alt text.',
   '{1.1.1,4.1.2}', 'A', 'critical',
   'Add an alt attribute describing the button action.',
   'https://dequeuniversity.com/rules/axe/4.10/input-image-alt'),

  ('label', 'Form elements must have labels',
   'Form inputs must have an associated, programmatically determinable label.',
   '{1.3.1,4.1.2}', 'A', 'critical',
   'Associate a <label for> with the control, or add aria-label / aria-labelledby.',
   'https://dequeuniversity.com/rules/axe/4.10/label'),

  ('link-name', 'Links must have discernible text',
   'Links must have an accessible name.',
   '{2.4.4,4.1.2}', 'A', 'serious',
   'Provide link text, or an aria-label, that describes the destination.',
   'https://dequeuniversity.com/rules/axe/4.10/link-name'),

  ('list', 'Lists must be structured correctly',
   '<ul>/<ol> must contain only <li> (and script/template) children.',
   '{1.3.1}', 'A', 'serious',
   'Ensure list elements contain only li children.',
   'https://dequeuniversity.com/rules/axe/4.10/list'),

  ('listitem', 'List items must be contained in a list',
   '<li> must have a <ul> or <ol> parent.',
   '{1.3.1}', 'A', 'serious',
   'Wrap li elements in a ul or ol parent.',
   'https://dequeuniversity.com/rules/axe/4.10/listitem'),

  ('meta-refresh', 'Timed meta refresh must not be used',
   'The page must not auto-refresh or redirect via meta refresh with a delay.',
   '{2.2.1,3.2.5}', 'A', 'critical',
   'Remove the meta refresh, or let users control or disable the timing.',
   'https://dequeuniversity.com/rules/axe/4.10/meta-refresh'),

  ('meta-viewport', 'Zooming and scaling must not be disabled',
   'The viewport meta tag must not disable user scaling.',
   '{1.4.4}', 'AA', 'critical',
   'Remove user-scalable=no and maximum-scale limits from the viewport meta tag.',
   'https://dequeuniversity.com/rules/axe/4.10/meta-viewport'),

  ('object-alt', 'object elements must have alternative text',
   '<object> elements must have a text alternative.',
   '{1.1.1}', 'A', 'serious',
   'Provide alternative text inside the object element or via aria-label.',
   'https://dequeuniversity.com/rules/axe/4.10/object-alt'),

  ('role-img-alt', 'Elements with role="img" must have alternative text',
   'Elements with role="img" must have an accessible name.',
   '{1.1.1}', 'A', 'serious',
   'Add aria-label or aria-labelledby to elements with role="img".',
   'https://dequeuniversity.com/rules/axe/4.10/role-img-alt'),

  ('scrollable-region-focusable', 'Scrollable regions must be keyboard accessible',
   'Scrollable content must be reachable and operable by keyboard.',
   '{2.1.1}', 'A', 'serious',
   'Add tabindex="0" to scrollable regions, or make a child focusable.',
   'https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable'),

  ('select-name', 'Select elements must have an accessible name',
   '<select> controls must have a label.',
   '{4.1.2}', 'A', 'critical',
   'Associate a label with the select, or add aria-label / aria-labelledby.',
   'https://dequeuniversity.com/rules/axe/4.10/select-name'),

  ('server-side-image-map', 'Server-side image maps must not be used',
   'Server-side image maps are not keyboard accessible.',
   '{2.1.1}', 'A', 'minor',
   'Replace server-side image maps with client-side maps or accessible links.',
   'https://dequeuniversity.com/rules/axe/4.10/server-side-image-map'),

  ('svg-img-alt', 'SVG images and graphics must have accessible text',
   'SVG elements with an img/graphics role must have an accessible name.',
   '{1.1.1}', 'A', 'serious',
   'Add a <title>, aria-label, or aria-labelledby to the SVG.',
   'https://dequeuniversity.com/rules/axe/4.10/svg-img-alt'),

  ('td-headers-attr', 'Table cells referencing headers must be valid',
   'headers attributes on <td> must reference ids of header cells in the same table.',
   '{1.3.1}', 'A', 'serious',
   'Ensure the headers attribute references valid th ids within the same table.',
   'https://dequeuniversity.com/rules/axe/4.10/td-headers-attr'),

  ('th-has-data-cells', 'Table headers must have associated data cells',
   '<th> elements must relate to data cells.',
   '{1.3.1}', 'A', 'serious',
   'Ensure each header cell describes data cells, or use scope/headers correctly.',
   'https://dequeuniversity.com/rules/axe/4.10/th-has-data-cells'),

  ('valid-lang', 'lang attributes on elements must be valid',
   'lang attributes used within content must have valid values.',
   '{3.1.2}', 'AA', 'serious',
   'Use valid BCP 47 language tags for inline lang attributes.',
   'https://dequeuniversity.com/rules/axe/4.10/valid-lang'),

  ('video-caption', 'Video elements must have captions',
   '<video> must provide captions for audio content.',
   '{1.2.2}', 'A', 'critical',
   'Add a captions track (<track kind="captions">) to the video.',
   'https://dequeuniversity.com/rules/axe/4.10/video-caption'),

  ('nested-interactive', 'Interactive controls must not be nested',
   'Interactive controls must not contain other focusable interactive controls.',
   '{4.1.2}', 'A', 'serious',
   'Restructure markup so interactive elements are not nested inside one another.',
   'https://dequeuniversity.com/rules/axe/4.10/nested-interactive'),

  ('landmark-one-main', 'Page should contain one main landmark',
   'The page should have a single, unique main landmark (best practice).',
   '{1.3.1}', 'A', 'moderate',
   'Add exactly one <main> (or role="main") landmark to the page.',
   'https://dequeuniversity.com/rules/axe/4.10/landmark-one-main'),

  ('page-has-heading-one', 'Page should contain a level-one heading',
   'The page should have a top-level <h1> (best practice).',
   '{1.3.1}', 'A', 'moderate',
   'Add a single descriptive h1 that identifies the page content.',
   'https://dequeuniversity.com/rules/axe/4.10/page-has-heading-one'),

  ('region', 'All page content should be contained by landmarks',
   'Content should sit inside landmark regions (best practice).',
   '{1.3.1}', 'A', 'moderate',
   'Wrap content in semantic landmarks (header, nav, main, footer, etc.).',
   'https://dequeuniversity.com/rules/axe/4.10/region'),

  ('tabindex', 'Positive tabindex values should not be used',
   'tabindex greater than zero disrupts the natural focus order.',
   '{2.4.3}', 'A', 'serious',
   'Remove positive tabindex values and rely on DOM order for focus.',
   'https://dequeuniversity.com/rules/axe/4.10/tabindex'),

  ('autocomplete-valid', 'autocomplete attributes must be used correctly',
   'autocomplete attribute values must be valid for the input purpose.',
   '{1.3.5}', 'AA', 'serious',
   'Use valid autocomplete tokens that match the input field purpose.',
   'https://dequeuniversity.com/rules/axe/4.10/autocomplete-valid')

on conflict (rule_id) do update set
  title          = excluded.title,
  description    = excluded.description,
  wcag_criteria  = excluded.wcag_criteria,
  wcag_level     = excluded.wcag_level,
  default_impact = excluded.default_impact,
  fix_guidance   = excluded.fix_guidance,
  help_url       = excluded.help_url,
  updated_at     = now();
