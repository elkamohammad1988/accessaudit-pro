# AccessAudit Pro — Product Requirements Document

**Version:** 1.0 (Draft for approval)
**Date:** 2026-06-13
**Owner:** Mohamed Elkabouri
**Status:** ✅ **Approved 2026-06-13.** Database phase in progress; frontend gated on review.

**Approved decisions (2026-06-13):**
1. **Worker hosting:** Railway for MVP (simpler ops; migrate later if needed).
2. **Pricing:** Free / Starter $29 / Agency $79 / Scale $199 — as proposed.
3. **MVP scan scope:** single page or manual URL list only — **no auto-crawl**.
4. **Language:** English only for MVP.
5. **Compliance focus:** **EAA + WCAG 2.2 AA primary**; US ADA is a secondary market for later.

---

## 1. Overview

### 1.1 Summary
**AccessAudit Pro** is a SaaS platform that lets web agencies and freelancers run **on-demand WCAG accessibility audits** of their clients' websites, review prioritized violations, and deliver **white-labeled, client-ready reports**.

The core loop: _enter a URL → scan → get a prioritized, WCAG-mapped report → export/share a branded deliverable._

### 1.2 Problem
Agencies are increasingly asked to deliver accessible websites (ADA lawsuits, EN 301 549 / European Accessibility Act enforcement from June 2025, Section 508). Existing tools are either:
- **Developer-only** (axe DevTools, Lighthouse) — not client-presentable, no multi-client management.
- **Enterprise-priced** (Siteimprove, Level Access, AudioEye) — overkill and unaffordable for small agencies.
- **One-off scanners** (WAVE, free checkers) — no history, no client workspaces, no branded reports.

There is a gap for an **affordable, agency-shaped** tool: multi-client organization, clean reports clients can read, and per-client billing/branding.

### 1.3 Target users (primary persona)
**"The Agency Operator"** — a small web/design agency or freelancer (1–15 people) managing 5–50 client sites.
- Needs to **audit many client sites** without juggling separate tools per client.
- Wants **white-label reports** they can hand to clients (or sell as a service line).
- Is **technical enough** to read code snippets, but their clients are not.
- Budget-sensitive: $30–$100/mo is acceptable; $500+/mo is not.

Secondary (later): in-house product teams (CI/CD integration), compliance officers (audit trails/certificates).

### 1.4 Goals & success metrics
| Goal | Metric | Target (first 90 days post-launch) |
|---|---|---|
| Activation | % of signups that run ≥1 scan | ≥ 60% |
| Core value | % of activated users that export/share a report | ≥ 40% |
| Retention | Week-4 org retention | ≥ 35% |
| Monetization | Free → paid conversion | ≥ 5% |
| Performance | Median scan completion (single page) | < 30s |
| Reliability | Scan success rate (non-error completion) | ≥ 97% |

### 1.5 Non-goals (for v1)
- Automatic remediation / auto-fixing of code.
- Manual/human-assisted audits or expert review marketplace.
- Native mobile apps.
- Continuous/scheduled monitoring (designed-for, but **not built** in MVP — see roadmap).
- PDF/document accessibility auditing (only web pages).
- Browser extension.

---

## 2. Scope & WCAG methodology

### 2.1 What "accessibility audit" means here
- **Standard:** WCAG 2.2 Levels A & AA (with 2.1 mapping retained). **Primary compliance framing is the European Accessibility Act (EAA) / EN 301 549**, which is the launch market. Report also maps to **ADA** and **Section 508** for the secondary US market.
- **Engine:** Automated rules via **axe-core** executed against a **fully rendered DOM** (headless Chromium / Playwright). This catches ~30–50% of WCAG issues — the automatable subset.
- **Honesty principle:** The product must clearly communicate that automated scanning ≠ full compliance. Every report includes a "manual checks recommended" section listing criteria that require human review (e.g., meaningful alt text quality, logical reading order, captions). This protects the agency legally and sets correct expectations.

### 2.2 Violation model
Each finding carries:
- **Impact:** `critical` | `serious` | `moderate` | `minor` (axe taxonomy).
- **WCAG criteria:** e.g., `1.1.1`, `1.4.3`, `4.1.2` + level (A/AA).
- **Rule id:** axe rule (e.g., `color-contrast`, `image-alt`).
- **Affected elements:** selector, HTML snippet, failure summary.
- **Fix guidance:** plain-language "how to fix" + link to help docs.
- **Page URL** it was found on.

---

## 3. Functional requirements

### 3.1 Accounts, organizations & teams
- Email/password + magic-link auth (Supabase Auth). Google OAuth optional in v1.1.
- On first login, user creates an **Organization** (the agency workspace). All data is scoped to an org.
- **Roles:** `owner`, `admin`, `member`, `viewer`.
- Team **invitations** by email; pending invites accepted via tokenized link.
- One user can belong to multiple organizations (org switcher).

### 3.2 Clients & projects
- **Client** = the agency's customer (a brand/company).
- **Project** (a.k.a. "Site") = a website belonging to a client (has a base URL, optional allowed-paths config).
- A client can have multiple projects; a project belongs to exactly one client.

### 3.3 Scans (the core)
- Initiate scan from a project (or quick "scan any URL" from dashboard, which auto-creates a scratch project).
- **Scan options:**
  - Single page (URL) — _MVP default_.
  - Multi-page: provide a list of URLs **or** a shallow crawl (max N pages, gated by plan).
  - Standard target: WCAG 2.2 AA (selectable A / AA / AAA-subset).
- **Scan lifecycle states:** `queued` → `running` → `completed` | `failed` | `partial`.
- Real-time progress in the UI (pages discovered / scanned).
- Results persisted: per-scan summary score, per-page results, per-violation detail.
- **Re-scan:** re-run a project; results comparable against previous scan (diff view in v1.1).

### 3.4 Reports & sharing
- **In-app report view:** score, violation breakdown by impact / by WCAG criterion / by page; filterable, sortable.
- **Violation detail:** element list, code snippets, fix guidance, WCAG references.
- **White-label PDF export:** agency logo, colors, optional cover note. (Gated to paid plans.)
- **Shareable public link:** read-only report at a tokenized URL (revocable; optional expiry; optional password — v1.1).
- Export raw data as CSV/JSON (paid).

### 3.5 Billing & limits
- Stripe-managed subscriptions per organization.
- Plan-based limits enforced server-side: # clients, # projects, scans/month, pages/scan, team seats, white-label on/off.
- In-app usage meter; graceful "limit reached → upgrade" prompts.
- Stripe Customer Portal for plan changes, payment methods, invoices.

### 3.6 Dashboard & activity
- Org dashboard: recent scans, average score trend, clients overview, usage this period.
- Activity/audit log (who scanned what, when; report shares).

---

## 4. Non-functional requirements
- **Security:** Postgres Row-Level Security on every table; org-scoped isolation; no client can read another org's data. Secrets (Stripe, service-role key) never exposed to the browser.
- **Privacy:** Scans only fetch publicly accessible pages. Store rendered HTML snippets only for flagged elements, not full page copies. Respect `robots.txt` for crawls (configurable per plan).
- **Performance:** Single-page scan median < 30s; report view loads < 1.5s.
- **Scalability:** Scan work runs off the request path via a queue + worker pool so the web app stays responsive under load.
- **Reliability:** Failed scans retry once; surface clear error reasons (timeout, blocked, 4xx/5xx, JS error).
- **Accessibility (dogfooding):** The product UI itself must meet WCAG 2.2 AA. Non-negotiable — we sell accessibility.
- **Observability:** Structured logs, scan duration metrics, error tracking (Sentry).

---

## 5. User flows

### 5.1 Onboarding → first scan (the "aha" path)
1. User signs up (email/password or magic link).
2. Verifies email → lands on **Create Organization** (agency name, optional logo).
3. Guided empty state: **"Run your first scan."** Enter a URL.
4. (Auto-creates a default client + project behind the scenes, or prompts to name them.)
5. Scan runs with live progress → results appear.
6. CTA: **"Export branded report"** → if free plan, prompt to upgrade for white-label; otherwise generate PDF.

### 5.2 Add a client and audit their site
1. Dashboard → **Clients** → **New Client** (name, contact, optional logo).
2. Within client → **New Project** (site name + base URL).
3. Project page → **New Scan** → choose single page or multi-page (plan-gated) → run.
4. Review results → export/share.

### 5.3 Run a scan & review results
1. From a project, click **New Scan**, configure options, **Start**.
2. UI shows `queued → running` with progress (pages scanned, % done).
3. On `completed`, redirect to **Report** view.
4. Filter by impact (Critical first), expand a violation → see elements + fix guidance + WCAG ref.
5. Mark violations (e.g., "ignore"/"flag for client") — _v1.1_.

### 5.4 Deliver a white-label report
1. From a completed scan → **Export / Share**.
2. Choose **PDF** (branded) or **Public link**.
3. PDF: pick branding profile (logo/colors auto-applied from org settings), optional cover note → generate → download.
4. Public link: generate tokenized URL → copy/share → (revoke anytime).

### 5.5 Invite a team member
1. Settings → **Team** → **Invite** (email + role).
2. Invitee receives email → accepts via link → joins org with assigned role.

### 5.6 Upgrade / hit a limit
1. User attempts an action beyond plan (e.g., 6th client on Starter).
2. Blocking modal: explains limit, shows next plan, **Upgrade**.
3. Stripe Checkout → on success, webhook updates subscription → limits lift immediately.

### 5.7 Re-scan & track over time (foundation for v2)
1. Project shows scan history (date, score, # critical).
2. Click **Re-scan** → new scan; later, **Compare** highlights new/fixed/persisting issues.

---

## 6. Database schema

> **⚠️ This section is the production (v1.0) north-star — 14 tables.** The **shipped
> MVP database is a lean 8-table subset** built on a single-owner model
> (`organizations.owner_id`), per the architecture review. For what is actually
> implemented in `supabase/migrations/`, see [`docs/ERD.md`](./ERD.md); for the
> rationale on what was trimmed and when each table returns, see
> [`docs/DB_REVIEW.md`](./DB_REVIEW.md). The tables below are the target to grow into.

> Postgres (Supabase). All tables have `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, and (where mutable) `updated_at`. RLS enabled on every table. Tenant key = `organization_id`.

### 6.1 Entity-relationship (textual)
```
auth.users (Supabase) 1───1 profiles
organizations 1───* organization_members *───1 profiles
organizations 1───* clients 1───* projects 1───* scans 1───* scan_pages 1───* violations
violations *───1 wcag_rules (reference)
organizations 1───1 subscriptions
organizations 1───* invitations
organizations 1───* reports
organizations 1───* usage_counters (per billing period)
organizations 1───* activity_log
```

### 6.2 Tables

**profiles** — app-level user data (mirrors `auth.users`).
| column | type | notes |
|---|---|---|
| id | uuid pk | = auth.users.id |
| email | text | |
| full_name | text | |
| avatar_url | text | |
| created_at | timestamptz | |

**organizations** — the agency workspace (tenant root).
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name | text not null | agency name |
| slug | text unique | for URLs |
| logo_url | text | white-label branding |
| brand_color | text | hex, for reports |
| created_by | uuid → profiles.id | |
| created_at / updated_at | timestamptz | |

**organization_members** — membership + role.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | |
| user_id | uuid → profiles | |
| role | text | `owner`\|`admin`\|`member`\|`viewer` |
| created_at | timestamptz | |
| | | unique(organization_id, user_id) |

**invitations** — pending team invites.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | |
| email | text not null | |
| role | text | invited role |
| token | text unique | tokenized accept link |
| invited_by | uuid → profiles | |
| status | text | `pending`\|`accepted`\|`expired`\|`revoked` |
| expires_at | timestamptz | |

**clients** — the agency's customers.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | |
| name | text not null | |
| contact_email | text | |
| logo_url | text | optional per-client branding |
| notes | text | |
| created_at / updated_at | timestamptz | |

**projects** — a website/property of a client.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | denormalized for RLS |
| client_id | uuid → clients | |
| name | text not null | |
| base_url | text not null | |
| crawl_config | jsonb | allowed paths, max pages, respect robots |
| created_at / updated_at | timestamptz | |

**scans** — a single audit run.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | |
| project_id | uuid → projects | |
| initiated_by | uuid → profiles | |
| status | text | `queued`\|`running`\|`completed`\|`failed`\|`partial` |
| scan_type | text | `single`\|`list`\|`crawl` |
| target_urls | jsonb | requested URLs |
| wcag_level | text | `A`\|`AA`\|`AAA` |
| score | numeric | 0–100 computed summary |
| totals | jsonb | counts by impact {critical, serious, moderate, minor} |
| pages_scanned | int | |
| error_reason | text | when failed |
| started_at / finished_at | timestamptz | duration |
| created_at | timestamptz | |

**scan_pages** — per-URL results within a scan.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| scan_id | uuid → scans | |
| organization_id | uuid → organizations | denormalized for RLS |
| url | text not null | |
| status | text | `ok`\|`error` |
| http_status | int | |
| score | numeric | per-page score |
| totals | jsonb | counts by impact |
| screenshot_url | text | optional, Storage |
| created_at | timestamptz | |

**violations** — individual findings.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| scan_page_id | uuid → scan_pages | |
| organization_id | uuid → organizations | denormalized for RLS |
| rule_id | text → wcag_rules.rule_id | axe rule id |
| impact | text | `critical`\|`serious`\|`moderate`\|`minor` |
| wcag_criteria | text[] | e.g. {'1.4.3','1.4.11'} |
| nodes | jsonb | affected elements: selector, html snippet, failureSummary |
| help_url | text | |
| status | text | `open`\|`ignored`\|`flagged` (v1.1) |
| created_at | timestamptz | |

**wcag_rules** — reference/lookup (seeded, read-mostly, global).
| column | type | notes |
|---|---|---|
| rule_id | text pk | axe rule id |
| title | text | human label |
| description | text | |
| wcag_criteria | text[] | |
| wcag_level | text | |
| default_impact | text | |
| fix_guidance | text | plain-language remediation |
| help_url | text | |

**reports** — generated deliverables (PDF/public link).
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | |
| scan_id | uuid → scans | |
| type | text | `pdf`\|`public_link` |
| file_url | text | Storage path (PDF) |
| share_token | text unique | public link token |
| is_public | bool | |
| expires_at | timestamptz | optional |
| created_by | uuid → profiles | |
| created_at | timestamptz | |

**subscriptions** — Stripe state (one per org).
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations unique | |
| stripe_customer_id | text | |
| stripe_subscription_id | text | |
| plan | text | `free`\|`starter`\|`agency`\|`scale` |
| status | text | `active`\|`trialing`\|`past_due`\|`canceled` |
| current_period_end | timestamptz | |
| seats | int | |
| created_at / updated_at | timestamptz | |

**usage_counters** — enforce per-period limits.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | |
| period_start | date | billing period |
| scans_used | int | |
| pages_used | int | |
| | | unique(organization_id, period_start) |

**activity_log** — audit trail.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid → organizations | |
| actor_id | uuid → profiles | |
| action | text | e.g. `scan.created`, `report.shared` |
| target_type / target_id | text / uuid | |
| metadata | jsonb | |
| created_at | timestamptz | |

### 6.3 Key indexes
- `scans (project_id, created_at desc)`, `scans (organization_id, status)`
- `scan_pages (scan_id)`, `violations (scan_page_id)`, `violations (organization_id, impact)`
- `organization_members (user_id)`, `projects (client_id)`, `clients (organization_id)`
- `reports (share_token)` unique, `invitations (token)` unique

---

## 7. Supabase architecture

### 7.1 Components used
- **Auth** — email/password + magic link; JWT carries `sub` (user id). Org membership resolved via `organization_members`.
- **Postgres + RLS** — single source of truth, tenant isolation enforced at the row level.
- **Storage** — buckets: `reports` (PDFs, private + signed URLs), `screenshots` (private), `branding` (logos, public-read).
- **Edge Functions (Deno)** — lightweight HTTP endpoints for: Stripe webhook handler, scan-trigger (enqueue), report-share token resolution.
- **Realtime** — subscribe to `scans` row updates so the UI reflects `queued → running → completed` live.
- **Database functions / triggers** — `handle_new_user()` to create a `profiles` row; helper `is_org_member(org_id)` for RLS.

### 7.2 The scanning worker (critical architecture decision)
> **axe-core requires a real rendered DOM.** This means **headless Chromium via Playwright**, which **cannot run inside Supabase Edge Functions** (Deno runtime, no bundled Chromium). The scan engine must live in a **separate Node worker service**.

**Chosen architecture: queue + dedicated worker.**
```
Web app (Next.js)
   │  POST /scans  → insert scans row (status=queued)
   ▼
Supabase Postgres  ──(enqueue: row in scans / pgmq queue)──►
                                                            │
                                                            ▼
                                          Scan Worker service (Node + Playwright + axe-core)
                                          - dequeues job
                                          - launches headless Chromium
                                          - loads page(s), injects axe-core, runs rules
                                          - writes scan_pages + violations
                                          - updates scans.status → completed (Realtime pushes to UI)
```
- **Queue mechanism (MVP):** Postgres-backed job queue using **Supabase `pgmq`** (or a simple `status=queued` poll with `SELECT … FOR UPDATE SKIP LOCKED`). Avoids adding Redis in v1.
- **Worker hosting (decided):** **Railway** for the MVP — a small always-on Node service (needs Chromium binary; Vercel serverless is a poor fit for long Playwright runs). Chosen for simpler deployment and lower operational complexity; can migrate to Render/Fly/AWS later if scale demands. Worker uses the **service-role key** to bypass RLS for writes.
- **Alternative considered:** a hosted headless-browser API (Browserless / ScrapingBee) to avoid managing Chromium. Trade-off: simpler ops vs. per-scan cost. _Decision: self-hosted worker for cost control; abstract the browser launch so we can swap to a hosted browser later._
- **Why off the request path:** scans take seconds-to-minutes and must not block HTTP requests or hit serverless timeouts.

### 7.3 RLS policy strategy (per table)
- Reference table `wcag_rules`: world-readable (`select` true), no writes from clients.
- All tenant tables: `select/insert/update/delete` allowed only when `is_org_member(organization_id)` returns true (membership-based), with role checks for destructive actions (only `owner`/`admin` can delete clients/projects, manage billing, invite).
- Worker writes use **service role** (RLS bypassed) — never exposed to the browser.
- Public report links: resolved via an **Edge Function** that validates `share_token` and returns sanitized data, bypassing RLS for that one read path only.

### 7.4 Environment & secrets
- Browser/client: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Server only: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Worker: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 8. Stripe plans

> Billing is **per organization**. Free trial requires no card. Plans gate limits + features. Seats can be add-ons on higher tiers.

| Feature / limit | **Free** | **Starter** $29/mo | **Agency** $79/mo | **Scale** $199/mo |
|---|---|---|---|---|
| Price (annual ~2 mo free) | $0 | $290/yr | $790/yr | $1,990/yr |
| Clients | 1 | 5 | Unlimited | Unlimited |
| Projects (sites) | 2 | 25 | Unlimited | Unlimited |
| Scans / month | 10 | 150 | 750 | 3,000 |
| Pages / scan | 1 | 25 | 100 | 500 |
| Team seats | 1 | 3 | 10 | 25 |
| White-label PDF reports | ❌ | ✅ | ✅ | ✅ |
| Public shareable links | ✅ (AccessAudit-branded) | ✅ | ✅ | ✅ |
| Remove "Powered by" branding | ❌ | ❌ | ✅ | ✅ |
| CSV/JSON export | ❌ | ✅ | ✅ | ✅ |
| Scheduled monitoring (v2) | ❌ | ❌ | ✅ | ✅ |
| API access (v2) | ❌ | ❌ | ❌ | ✅ |
| Priority scan queue | ❌ | ❌ | ✅ | ✅ |
| Support | Community | Email | Priority email | Priority + onboarding |

**Stripe mechanics:**
- **Products/Prices:** one Product per plan, monthly + annual Prices. Seat overages on Agency/Scale via per-seat add-on Price (optional v1.1).
- **Checkout:** Stripe Checkout for new subscriptions; **Customer Portal** for upgrades/downgrades/cancel/invoices.
- **Webhooks** (Edge Function) handle: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.payment_failed`. Each updates the `subscriptions` row → limits enforced from DB.
- **Limit enforcement:** server-side check against `subscriptions.plan` + `usage_counters` before allowing scan/client/project creation. Overage → friendly upgrade prompt (no surprise charges in v1).
- **Trial:** Free plan is open-ended (not time-boxed) to maximize activation; consider a 14-day Agency trial later.

---

## 9. MVP scope

### 9.1 In scope (v1.0 — ship this)
- ✅ Auth (email/password + magic link), email verification.
- ✅ Organization creation + org switcher; team invites with roles.
- ✅ Clients CRUD, Projects CRUD.
- ✅ **On-demand scans**: single page + multi-page-by-URL-list; live progress via Realtime.
- ✅ Scan engine: Playwright + axe-core worker, WCAG 2.2 AA, score + violations.
- ✅ Report view: summary score, breakdown by impact / WCAG / page, violation detail with fix guidance.
- ✅ **White-label PDF export** + **public shareable link**.
- ✅ Stripe: Free + Starter + Agency plans, Checkout + Portal, limit enforcement.
- ✅ Dashboard (recent scans, usage), Settings (profile, org/branding, team, billing).
- ✅ UI meets WCAG 2.2 AA (dogfooding).

### 9.2 Explicitly out of scope (deferred)
- ⏳ Scheduled/recurring monitoring + regression alerts → **v2** (schema already supports re-scans).
- ⏳ Scan comparison/diff view → v1.1.
- ⏳ Crawl-based discovery (auto-find pages) → v1.1 (MVP is URL-list based).
- ⏳ Violation triage states (ignore/flag) → v1.1.
- ⏳ API access, CI/CD integration → v2 (Scale plan).
- ⏳ Google OAuth → v1.1.
- ⏳ Compliance certificates → v2.

### 9.3 MVP acceptance criteria
- A new user can sign up, create an org, add a client+project, run a single-page scan, and view a WCAG report in **under 5 minutes**.
- A paid user can export a branded PDF and share a public link.
- Plan limits block over-usage and route to upgrade.
- Scan success rate ≥ 97% on a 50-site test set; median single-page scan < 30s.

---

## 10. Screens list

**Public / unauthenticated**
1. Landing/marketing (minimal — can be a separate static page; not core app).
2. Sign up
3. Log in
4. Forgot / reset password
5. Accept invitation
6. **Public report view** (tokenized, read-only)

**Onboarding**
7. Create organization (name, logo, brand color)
8. First-run empty state / "Run your first scan"

**App core**
9. Dashboard (recent scans, score trend, usage meter, quick-scan)
10. Clients — list
11. Client — detail (projects under client)
12. Projects — list (within client)
13. Project — detail (scan history, "New Scan")
14. New scan — config modal/page (URL(s), type, WCAG level)
15. Scan — running/progress view
16. **Report** — results overview (score, breakdowns, filters)
17. Violation — detail (elements, snippets, fix guidance, WCAG refs)
18. Report — export/share (PDF options, public link management)

**Settings**
19. Profile (name, avatar, password)
20. Organization (name, slug, logo, brand color — white-label)
21. Team (members list, invite, roles)
22. Billing (current plan, usage, upgrade → Stripe Portal/Checkout)
23. Activity log

**System**
24. Limit-reached / upgrade modal
25. Error & empty states (scan failed, no data, 404)

---

## 11. Folder structure

> Monorepo (pnpm workspaces) — separates the Next.js app from the Playwright worker, with shared types. Pragmatic for a small team; can collapse to a single app if preferred.

```
accessaudit-pro/
├── apps/
│   ├── web/                          # Next.js (App Router) — the SaaS UI + API routes
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/      # landing, pricing
│   │   │   │   ├── (auth)/           # login, signup, reset, accept-invite
│   │   │   │   ├── (app)/            # authenticated app (dashboard, clients, projects, scans, settings)
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── clients/
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── scans/
│   │   │   │   │   └── settings/
│   │   │   │   ├── r/[token]/        # public report view
│   │   │   │   └── api/              # route handlers (scan-trigger, stripe-checkout)
│   │   │   ├── components/           # UI components (shadcn/ui based)
│   │   │   ├── features/             # feature modules (clients, scans, reports, billing)
│   │   │   ├── lib/                  # supabase client, stripe client, helpers
│   │   │   ├── hooks/
│   │   │   └── styles/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── worker/                       # scan worker (Node + Playwright + axe-core)
│       ├── src/
│       │   ├── index.ts              # queue consumer loop
│       │   ├── scanner/              # browser launch, axe injection, rule run
│       │   ├── scoring/              # score computation
│       │   ├── persistence/          # writes to Supabase (service role)
│       │   └── pdf/                  # report PDF generation (or in web)
│       └── package.json
│
├── packages/
│   ├── database/                     # supabase migrations, generated TS types, seed (wcag_rules)
│   │   ├── migrations/
│   │   ├── seed/
│   │   └── types.ts
│   ├── shared/                       # shared types, constants, WCAG mappings, plan limits
│   └── ui/                           # (optional) shared design-system components
│
├── supabase/
│   ├── migrations/                   # (or symlinked to packages/database)
│   ├── functions/                    # edge functions: stripe-webhook, share-resolver
│   └── config.toml
│
├── docs/
│   ├── PRD.md                        # this document
│   └── ...
├── .env.example
├── pnpm-workspace.yaml
├── turbo.json                        # (optional) Turborepo for task running
└── README.md
```

**Recommended stack inside `apps/web`:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query, Supabase JS client (SSR auth via `@supabase/ssr`), Stripe SDK, Zod for validation, React Hook Form, Sentry.

---

## 12. Development roadmap

### Phase 0 — Foundations (Week 1)
- Repo + monorepo tooling, env config, CI lint/test.
- Supabase project: schema migrations, RLS policies, `wcag_rules` seed, `handle_new_user` trigger.
- Auth flows (signup/login/reset/magic link) + protected routing + SSR session.
- App shell: layout, nav, org switcher.

### Phase 1 — Tenancy & data model (Week 2)
- Organization creation + onboarding.
- Team invitations + roles + RLS role checks.
- Clients CRUD, Projects CRUD.
- Settings: profile, organization (branding), team.

### Phase 2 — Scan engine (Weeks 3–4) — _highest risk, do early_
- Worker service scaffold (Node + Playwright + axe-core) on Railway/Render.
- Queue: `scans` enqueue + worker dequeue (pgmq or `FOR UPDATE SKIP LOCKED`).
- Single-page scan end-to-end: run rules → persist `scan_pages` + `violations` → compute score.
- Realtime status updates to UI; running/progress screen.
- Error handling, retries, timeouts.

### Phase 3 — Reports (Week 5)
- Report view: summary, breakdowns (impact / WCAG / page), filters, violation detail + fix guidance.
- Multi-page-by-URL-list scans.
- White-label PDF export.
- Public shareable links (Edge Function token resolver) + revoke.

### Phase 4 — Billing (Week 6)
- Stripe products/prices; Checkout + Customer Portal.
- Webhook Edge Function → `subscriptions` sync.
- Server-side limit enforcement + `usage_counters` + upgrade prompts.
- Dashboard usage meter.

### Phase 5 — Polish & launch (Week 7)
- Dashboard finalization, activity log, empty/error states.
- Accessibility self-audit of the app (WCAG 2.2 AA) + fixes.
- E2E tests (Playwright) for core flows; load test scan queue.
- Marketing/pricing page, docs, onboarding copy.
- Beta launch with 5–10 design partner agencies.

### Phase 6 — Post-MVP (v1.1 → v2)
- v1.1: scan diff/compare, crawl discovery, violation triage states, Google OAuth, CSV/JSON export polish.
- v2: **scheduled monitoring + regression alerts**, API access, CI/CD integration, compliance certificates, in-house-team persona features.

### Risks & mitigations
| Risk | Mitigation |
|---|---|
| Playwright/Chromium ops complexity & cost | Abstract browser launch; budget worker hosting; option to swap to hosted browser API. |
| Scans on JS-heavy / auth-gated / blocked sites | Clear error reasons; v1 = public pages only; document limits. |
| "Automated = compliant" misunderstanding (legal) | Prominent disclaimers + manual-checks section in every report. |
| Long scans hitting serverless timeouts | Worker is off-request-path with a queue (core architectural choice). |
| RLS misconfiguration leaking cross-org data | Membership helper function + test suite asserting isolation. |

---

## 13. Open questions — RESOLVED (2026-06-13)
1. ~~**Worker hosting**~~ → **Railway** for MVP.
2. ~~**Pricing**~~ → **Confirmed** Free / $29 / $79 / $199.
3. ~~**Crawl in MVP?**~~ → **No auto-crawl.** MVP = single page + manual URL list.
4. ~~**Marketing site**~~ → **English only** for MVP.
5. ~~**Brand/legal compliance emphasis**~~ → **EAA / EN 301 549 + WCAG 2.2 AA primary**; ADA secondary/later.

---

_End of PRD v1.0 — awaiting approval before any code is written._
