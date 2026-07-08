/**
 * In-memory demo dataset — the local mock "database" that backs the app when no
 * Supabase project is configured (see `isDemoMode` in lib/env). It ports the
 * realistic portfolio tenant from `scripts/seed-demo.mjs` (Pixel & Pine Studio,
 * a design agency running WCAG audits for six clients) into typed, mutable arrays
 * so the redesigned UI renders fully populated — dashboard trends, severity
 * rollups, client/project lists, and a complete shareable report — with zero
 * backend. Mutations (create/edit/archive) mutate these arrays in place, so
 * create → detail flows work end-to-end for the lifetime of the dev process.
 *
 * Pure, isomorphic module (no `server-only`, no Node/Supabase imports) so the one
 * client component that touches the mock (realtime scan-sync) can bundle it too.
 */
import type {
  Client,
  Organization,
  Profile,
  Project,
  Scan,
  ScanPage,
  Subscription,
  Violation,
} from "@accessaudit/database";

export const DEMO_ORG_ID = "22222222-2222-2222-2222-222222222222";
export const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_USER_EMAIL = "demo@accessaudit.pro";
export const DEMO_USER_NAME = "Alex Rivera";

const pad = (n: number) => String(n).padStart(12, "0");
const uid = (p: string, n: number) => `${p}-0000-0000-0000-${pad(n)}`;
const nowISO = () => new Date().toISOString();
const dayISO = (daysAgo: number, h = 9, m = 12) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
};
const minAgoISO = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

/** Believable severity totals derived from a score (fewer/worse findings as the
 *  score climbs), with deterministic per-scan jitter so no two look identical. */
export function totalsFor(score: number, seed: number) {
  const gap = Math.max(0, 100 - score);
  const j = (k: number) => ((seed * 9301 + k * 49297) % 233280) / 233280;
  return {
    critical: Math.max(0, Math.round(gap / 17 - 0.4 + j(1) * 1.1)),
    serious: Math.round(gap / 9 + j(2) * 1.4),
    moderate: Math.round(gap / 6 + j(3) * 2),
    minor: Math.round(gap / 8 + j(4) * 2),
  };
}

// ── Auth identity ──────────────────────────────────────────────────────────
export const demoUser = {
  id: DEMO_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: DEMO_USER_EMAIL,
  email_confirmed_at: dayISO(90),
  phone: "",
  confirmed_at: dayISO(90),
  last_sign_in_at: nowISO(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: DEMO_USER_NAME },
  identities: [],
  created_at: dayISO(90),
  updated_at: nowISO(),
};

export const demoSession = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: demoUser,
};

// ── Tenant, profile, subscription ────────────────────────────────────────────
const profiles: Profile[] = [
  {
    id: DEMO_USER_ID,
    email: DEMO_USER_EMAIL,
    full_name: DEMO_USER_NAME,
    avatar_url: null,
    created_at: dayISO(90),
    updated_at: nowISO(),
  },
];

const organizations: Organization[] = [
  {
    id: DEMO_ORG_ID,
    name: "Pixel & Pine Studio",
    slug: "pixel-and-pine",
    logo_url: null,
    brand_color: "#B4552D",
    owner_id: DEMO_USER_ID,
    created_at: dayISO(90),
    updated_at: nowISO(),
  },
];

const subscriptions: Subscription[] = [
  {
    id: uid("a0000000", 1),
    organization_id: DEMO_ORG_ID,
    stripe_customer_id: "cus_demo_pixelpine",
    stripe_subscription_id: "sub_demo_pixelpine",
    plan: "agency",
    status: "active",
    current_period_end: dayISO(-19, 12, 0),
    seats: 3,
    created_at: dayISO(90),
    updated_at: nowISO(),
  },
];

// ── Clients ──────────────────────────────────────────────────────────────────
const clientSeeds = [
  { i: 1, name: "Northwind Coffee", email: "web@northwindcoffee.example", notes: "Regional coffee retailer — marketing site + online ordering. Ongoing WCAG 2.2 AA remediation retainer.", d: 86 },
  { i: 2, name: "Acme Legal", email: "it@acmelegal.example", notes: "Corporate law firm. Hard EAA (June 2025) deadline; quarterly conformance evidence for procurement.", d: 80 },
  { i: 3, name: "Meridian Financial", email: "digital@meridianfinancial.example", notes: "Retail banking group. VPAT + ADA Title III risk review across the banking portal and marketing site.", d: 72 },
  { i: 4, name: "Harbor Health Group", email: "webteam@harborhealth.example", notes: "Regional healthcare network. Patient-portal Section 508 + WCAG 2.2 AA conformance program.", d: 63 },
  { i: 5, name: "Vantage Retail", email: "ecom@vantageretail.example", notes: "DTC e-commerce. Checkout and product-detail accessibility; peak-season readiness audit.", d: 45 },
  { i: 6, name: "Lumen Media", email: "product@lumenmedia.example", notes: "Digital publisher. Newsroom CMS templates and subscription funnel accessibility audits.", d: 31 },
];
const clients: Client[] = clientSeeds.map((c) => ({
  id: uid("c0000000", c.i),
  organization_id: DEMO_ORG_ID,
  name: c.name,
  contact_email: c.email,
  logo_url: null,
  notes: c.notes,
  archived_at: null,
  created_at: dayISO(c.d),
  updated_at: dayISO(c.d),
}));

// ── Projects (each with a scan plan [daysAgo, score], oldest→newest) ──────────
type ProjectSeed = { i: number; c: number; name: string; url: string; plan: [number, number][]; hero?: boolean };
const projectSeeds: ProjectSeed[] = [
  { i: 1, c: 1, name: "Northwind Marketing Site", url: "https://northwindcoffee.example", plan: [[82, 63], [59, 71], [38, 79], [12, 86]] },
  { i: 2, c: 1, name: "Northwind Online Ordering", url: "https://order.northwindcoffee.example", plan: [[74, 58], [40, 69], [9, 81]] },
  { i: 3, c: 2, name: "Acme Legal — Public Site", url: "https://acmelegal.example", plan: [[72, 67], [44, 78], [16, 88]] },
  { i: 4, c: 3, name: "Meridian Banking Portal", url: "https://portal.meridianfinancial.example", plan: [[66, 61], [48, 72], [27, 83], [5, 91]], hero: true },
  { i: 5, c: 3, name: "Meridian Marketing Site", url: "https://www.meridianfinancial.example", plan: [[63, 74], [24, 85]] },
  { i: 6, c: 4, name: "Harbor Patient Portal", url: "https://my.harborhealth.example", plan: [[58, 64], [33, 76], [8, 84]] },
  { i: 7, c: 4, name: "Harbor Public Site", url: "https://harborhealth.example", plan: [[55, 77], [19, 87]] },
  { i: 8, c: 5, name: "Vantage Storefront", url: "https://shop.vantageretail.example", plan: [[42, 70], [20, 79], [3, 88]] },
  { i: 9, c: 6, name: "Lumen News", url: "https://news.lumenmedia.example", plan: [[28, 75], [10, 86]] },
];
const projects: Project[] = projectSeeds.map((p) => ({
  id: uid("b0000000", p.i),
  organization_id: DEMO_ORG_ID,
  client_id: uid("c0000000", p.c),
  name: p.name,
  base_url: p.url,
  archived_at: null,
  created_at: dayISO(p.plan[0][0] + 1),
  updated_at: dayISO(p.plan[p.plan.length - 1][0]),
}));

// ── Scans ────────────────────────────────────────────────────────────────────
const ZERO = { critical: 0, serious: 0, moderate: 0, minor: 0 };
function blankScan(over: Partial<Scan>): Scan {
  return {
    id: "",
    organization_id: DEMO_ORG_ID,
    project_id: "",
    initiated_by: DEMO_USER_ID,
    status: "completed",
    scan_type: "single",
    target_urls: [],
    wcag_level: "AA",
    score: null,
    totals: ZERO,
    pages_scanned: 0,
    error_reason: null,
    share_token: null,
    is_public: false,
    shared_at: null,
    started_at: null,
    last_progress_at: null,
    finished_at: null,
    attempts: 1,
    created_at: nowISO(),
    ...over,
  };
}

const scans: Scan[] = [];
let s = 0;
let heroScanId: string | null = null;
for (const p of projectSeeds) {
  p.plan.forEach(([daysAgo, score], idx) => {
    s++;
    const multi = s % 3 === 0;
    const isNewest = idx === p.plan.length - 1;
    const hero = Boolean(p.hero) && isNewest;
    const id = uid("d0000000", s);
    if (hero) heroScanId = id;
    scans.push(
      blankScan({
        id,
        project_id: uid("b0000000", p.i),
        status: "completed",
        scan_type: multi ? "list" : "single",
        target_urls: multi ? [`${p.url}/`, `${p.url}/pricing`] : [`${p.url}/`],
        score,
        totals: totalsFor(score, s),
        pages_scanned: multi ? 2 : 1,
        started_at: dayISO(daysAgo, 9, 2),
        finished_at: dayISO(daysAgo, 9, 5),
        created_at: dayISO(daysAgo, 9, 0),
        ...(hero
          ? { is_public: true, shared_at: dayISO(daysAgo, 9, 6), share_token: "pxpnmeridianbankingportalreport01" }
          : {}),
      }),
    );
  });
}
// Live activity (drives the breathing "live" dot) + one realistic failure.
scans.push(
  blankScan({ id: uid("d0000000", 90), project_id: uid("b0000000", 8), status: "running", scan_type: "list", target_urls: ["https://shop.vantageretail.example/", "https://shop.vantageretail.example/cart"], started_at: minAgoISO(2), last_progress_at: minAgoISO(1), created_at: minAgoISO(2) }),
  blankScan({ id: uid("d0000000", 91), project_id: uid("b0000000", 9), status: "queued", scan_type: "single", target_urls: ["https://news.lumenmedia.example/"], created_at: minAgoISO(1) }),
  blankScan({ id: uid("d0000000", 92), project_id: uid("b0000000", 6), status: "failed", scan_type: "single", target_urls: ["https://my.harborhealth.example/"], error_reason: "Target returned HTTP 503 (temporarily unavailable). Retried 3×; will re-queue.", started_at: dayISO(6, 14, 0), created_at: dayISO(6, 14, 0) }),
);

// ── Hero report detail — pages + violations for the shared Meridian scan ──────
const scan_pages: ScanPage[] = [];
const violations: Violation[] = [];
if (heroScanId) {
  const p1 = uid("e0000000", 1);
  const p2 = uid("e0000000", 2);
  scan_pages.push(
    { id: p1, scan_id: heroScanId, organization_id: DEMO_ORG_ID, url: "https://portal.meridianfinancial.example/", status: "ok", http_status: 200, score: 93, totals: { critical: 0, serious: 1, moderate: 2, minor: 1 }, created_at: dayISO(5, 9, 4) },
    { id: p2, scan_id: heroScanId, organization_id: DEMO_ORG_ID, url: "https://portal.meridianfinancial.example/pricing", status: "ok", http_status: 200, score: 89, totals: { critical: 0, serious: 2, moderate: 1, minor: 1 }, created_at: dayISO(5, 9, 4) },
  );
  const V = (n: number, page: string, rule: string, impact: Violation["impact"], wcag: string[], desc: string, help: string, node: string, sfx: string, urlrule: string): Violation => ({
    id: uid("f0000000", n),
    scan_page_id: page,
    organization_id: DEMO_ORG_ID,
    rule_id: rule,
    impact,
    wcag_criteria: wcag,
    description: desc,
    help_text: help,
    nodes: [{ target: [node], html: `<${node.replace(/[.#].*/, "")} …>`, failureSummary: sfx }],
    help_url: `https://dequeuniversity.com/rules/axe/4.10/${urlrule}`,
    created_at: dayISO(5, 9, 4),
  });
  violations.push(
    V(1, p1, "color-contrast", "serious", ["1.4.3"], "Elements must meet minimum color contrast ratio thresholds.", "Increase text contrast to at least 4.5:1 (3:1 for large text).", "a.footer-link", "Contrast 4.12:1, expected 4.5:1", "color-contrast"),
    V(2, p1, "landmark-unique", "moderate", ["1.3.1"], "Landmarks must have a unique role or accessible name.", "Give each <nav>/<aside> a distinct aria-label.", "nav.utility", "Two navigation landmarks share the same name", "landmark-unique"),
    V(3, p1, "region", "moderate", ["1.3.1"], "All page content should be contained by landmarks.", "Wrap orphaned content in a <main>/<section> landmark.", "div.promo", "Content not contained in a landmark", "region"),
    V(4, p1, "meta-viewport", "minor", ["1.4.4"], "Zooming and scaling must not be disabled.", "Remove user-scalable=no / maximum-scale from the viewport meta.", "meta[name=viewport]", "user-scalable=no restricts zoom", "meta-viewport"),
    V(5, p2, "link-name", "serious", ["2.4.4", "4.1.2"], "Links must have discernible text.", "Provide link text or an aria-label describing the destination.", "a.icon-only", "Link has no discernible text", "link-name"),
    V(6, p2, "aria-required-attr", "serious", ["4.1.2"], "Required ARIA attributes must be provided.", "Add aria-checked to elements with role=switch.", "div[role=switch]", "Missing required attribute aria-checked", "aria-required-attr"),
    V(7, p2, "heading-order", "moderate", ["1.3.1"], "Heading levels should increase by one.", "Reorder headings so levels are not skipped.", "h4.card-title", "Heading order invalid: h4 follows h2", "heading-order"),
  );
}

/** The mutable in-memory tables. Keyed by table name so the mock client can look
 *  them up generically. Every value is an array of plain row objects.
 *
 *  Cached on `globalThis` so it is a TRUE singleton across Next's separate server
 *  module instances. Next bundles Server Actions and the RSC/render pipeline into
 *  distinct module registries, so a plain module-level `const` is evaluated once
 *  per layer — meaning a row written by an action (e.g. a new scan) would be
 *  invisible to the page that renders it, and the create→report flow would 404.
 *  A `globalThis` slot is shared by every instance in the process, so demo writes
 *  persist across the action→navigation boundary for the lifetime of the server. */
const globalForDemo = globalThis as typeof globalThis & {
  __accessauditDemoDb?: Record<string, Array<Record<string, unknown>>>;
};

export const demoDb: Record<string, Array<Record<string, unknown>>> =
  globalForDemo.__accessauditDemoDb ??
  (globalForDemo.__accessauditDemoDb = {
    profiles,
    organizations,
    subscriptions,
    clients,
    projects,
    scans,
    scan_pages,
    violations,
    stripe_events: [] as Array<Record<string, unknown>>,
    rate_limits: [] as Array<Record<string, unknown>>,
  });
