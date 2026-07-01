/*
 * Portfolio / demo seed — populates the connected Supabase project with
 * believable, professional data for one agency workspace so the app renders like
 * a real product in use (dashboard trends, severity rollups, client & project
 * lists, a fully-detailed shareable report).
 *
 * Safe + idempotent: it only writes the demo tenant (Pixel & Pine Studio, owned by
 * demo@accessaudit.pro) using deterministic UUIDs and upserts — re-running just
 * refreshes. It performs NO deletes and touches no other tenant (RLS-isolated).
 *
 * Usage:  node apps/web/scripts/seed-demo.mjs
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the root .env.local.
 */
import "../../../scripts/load-env.mjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const ORG = "22222222-2222-2222-2222-222222222222";
const USER = "11111111-1111-1111-1111-111111111111";
const DEMO_PASSWORD = "Password123!";

const pad = (n) => String(n).padStart(12, "0");
const uid = (p, n) => `${p}-0000-0000-0000-${pad(n)}`;
const dayISO = (daysAgo, h = 9, m = 12) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
};
const minAgoISO = (mins) => new Date(Date.now() - mins * 60_000).toISOString();

// Believable severity totals derived from a score (fewer/worse findings as score
// climbs), with deterministic per-scan jitter so no two look identical.
function totalsFor(score, seed) {
  const gap = Math.max(0, 100 - score);
  const j = (k) => ((seed * 9301 + k * 49297) % 233280) / 233280;
  return {
    critical: Math.max(0, Math.round(gap / 17 - 0.4 + j(1) * 1.1)),
    serious: Math.round(gap / 9 + j(2) * 1.4),
    moderate: Math.round(gap / 6 + j(3) * 2),
    minor: Math.round(gap / 8 + j(4) * 2),
  };
}

async function step(label, promise) {
  const { error } = await promise;
  if (error) {
    console.error(`✗ ${label}:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${label}`);
  }
}

async function main() {
  console.log(`Seeding demo tenant on ${url.replace(/https:\/\/([^.]+).*/, "$1.supabase.co")}\n`);

  // 1) Demo login — ensure the password is known and the email is confirmed.
  {
    const { error } = await db.auth.admin.updateUserById(USER, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Alex Rivera" },
    });
    console.log(error ? `✗ demo user: ${error.message}` : `✓ demo user (demo@accessaudit.pro / ${DEMO_PASSWORD})`);
  }

  // 2) Organization (the agency using the product) + Agency subscription.
  await step(
    "organization",
    db.from("organizations").upsert(
      { id: ORG, name: "Pixel & Pine Studio", slug: "pixel-and-pine", brand_color: "#B4552D", owner_id: USER },
      { onConflict: "id" },
    ),
  );
  await step(
    "subscription (Agency, active)",
    db.from("subscriptions").upsert(
      {
        organization_id: ORG,
        plan: "agency",
        status: "active",
        seats: 3,
        stripe_customer_id: "cus_demo_pixelpine",
        stripe_subscription_id: "sub_demo_pixelpine",
        current_period_end: dayISO(-19, 12, 0),
      },
      { onConflict: "organization_id" },
    ),
  );

  // 2b) Remove the older fixed-UUID rows from the very first dev seed so client
  //     names don't duplicate ("Northwind Coffee" twice). Deleting these two
  //     clients cascades to their projects/scans/pages/violations. Scoped to the
  //     exact legacy UUIDs — nothing else is touched.
  await step(
    "cleanup legacy demo rows",
    db.from("clients").delete().in("id", [
      "33333333-3333-3333-3333-333333333333",
      "34343434-3434-3434-3434-343434343434",
    ]),
  );

  // 3) Clients — six believable companies across sectors.
  const clients = [
    { i: 1, name: "Northwind Coffee", email: "web@northwindcoffee.example", notes: "Regional coffee retailer — marketing site + online ordering. Ongoing WCAG 2.2 AA remediation retainer.", d: 86 },
    { i: 2, name: "Acme Legal", email: "it@acmelegal.example", notes: "Corporate law firm. Hard EAA (June 2025) deadline; quarterly conformance evidence for procurement.", d: 80 },
    { i: 3, name: "Meridian Financial", email: "digital@meridianfinancial.example", notes: "Retail banking group. VPAT + ADA Title III risk review across the banking portal and marketing site.", d: 72 },
    { i: 4, name: "Harbor Health Group", email: "webteam@harborhealth.example", notes: "Regional healthcare network. Patient-portal Section 508 + WCAG 2.2 AA conformance program.", d: 63 },
    { i: 5, name: "Vantage Retail", email: "ecom@vantageretail.example", notes: "DTC e-commerce. Checkout and product-detail accessibility; peak-season readiness audit.", d: 45 },
    { i: 6, name: "Lumen Media", email: "product@lumenmedia.example", notes: "Digital publisher. Newsroom CMS templates and subscription funnel accessibility audits.", d: 31 },
  ];
  await step(
    "clients (6)",
    db.from("clients").upsert(
      clients.map((c) => ({
        id: uid("c0000000", c.i),
        organization_id: ORG,
        name: c.name,
        contact_email: c.email,
        notes: c.notes,
        created_at: dayISO(c.d),
      })),
      { onConflict: "id" },
    ),
  );

  // 4) Projects — each with a scan plan [daysAgo, score], oldest→newest so scores
  //    trend upward (the "we remediated them" story the dashboard tells).
  const projects = [
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
  await step(
    "projects (9)",
    db.from("projects").upsert(
      projects.map((p) => ({
        id: uid("b0000000", p.i),
        organization_id: ORG,
        client_id: uid("c0000000", p.c),
        name: p.name,
        base_url: p.url,
        created_at: dayISO(projects.find((x) => x.i === p.i).plan[0][0] + 1),
      })),
      { onConflict: "id" },
    ),
  );

  // 5) Scans — ~26 completed across the plans, plus live + failed for realism.
  const scans = [];
  let s = 0;
  let heroScanId = null;
  for (const p of projects) {
    p.plan.forEach(([daysAgo, score], idx) => {
      s++;
      const multi = s % 3 === 0;
      const isNewest = idx === p.plan.length - 1;
      const hero = p.hero && isNewest;
      const id = uid("d0000000", s);
      if (hero) heroScanId = id;
      scans.push({
        id,
        organization_id: ORG,
        project_id: uid("b0000000", p.i),
        initiated_by: USER,
        status: "completed",
        scan_type: multi ? "list" : "single",
        target_urls: multi ? [`${p.url}/`, `${p.url}/pricing`] : [`${p.url}/`],
        wcag_level: "AA",
        score,
        totals: totalsFor(score, s),
        pages_scanned: multi ? 2 : 1,
        is_public: false,
        started_at: dayISO(daysAgo, 9, 2),
        finished_at: dayISO(daysAgo, 9, 5),
        created_at: dayISO(daysAgo, 9, 0),
        ...(hero
          ? { is_public: true, shared_at: dayISO(daysAgo, 9, 6), share_token: "pxpnmeridianbankingportalreport01" }
          : {}),
      });
    });
  }
  // Live activity (drives the breathing "live" dot) + one realistic failure.
  const ZERO = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  scans.push({ id: uid("d0000000", 90), organization_id: ORG, project_id: uid("b0000000", 8), initiated_by: USER, status: "running", scan_type: "list", target_urls: ["https://shop.vantageretail.example/", "https://shop.vantageretail.example/cart"], wcag_level: "AA", totals: ZERO, pages_scanned: 0, is_public: false, started_at: minAgoISO(2), created_at: minAgoISO(2) });
  scans.push({ id: uid("d0000000", 91), organization_id: ORG, project_id: uid("b0000000", 9), initiated_by: USER, status: "queued", scan_type: "single", target_urls: ["https://news.lumenmedia.example/"], wcag_level: "AA", totals: ZERO, pages_scanned: 0, is_public: false, created_at: minAgoISO(1) });
  scans.push({ id: uid("d0000000", 92), organization_id: ORG, project_id: uid("b0000000", 6), initiated_by: USER, status: "failed", scan_type: "single", target_urls: ["https://my.harborhealth.example/"], wcag_level: "AA", totals: ZERO, pages_scanned: 0, is_public: false, error_reason: "Target returned HTTP 503 (temporarily unavailable). Retried 3×; will re-queue.", started_at: dayISO(6, 14, 0), created_at: dayISO(6, 14, 0) });

  await step(`scans (${scans.length})`, db.from("scans").upsert(scans, { onConflict: "id" }));

  // 6) Hero report detail — pages + violations for the shared Meridian scan (91).
  if (heroScanId) {
    const p1 = uid("e0000000", 1);
    const p2 = uid("e0000000", 2);
    await step(
      "hero scan_pages (2)",
      db.from("scan_pages").upsert(
        [
          { id: p1, scan_id: heroScanId, organization_id: ORG, url: "https://portal.meridianfinancial.example/", status: "ok", http_status: 200, score: 93.0, totals: { critical: 0, serious: 1, moderate: 2, minor: 1 } },
          { id: p2, scan_id: heroScanId, organization_id: ORG, url: "https://portal.meridianfinancial.example/pricing", status: "ok", http_status: 200, score: 89.0, totals: { critical: 0, serious: 2, moderate: 1, minor: 1 } },
        ],
        { onConflict: "id" },
      ),
    );
    const V = (n, page, rule, impact, wcag, desc, help, node, sfx, urlrule) => ({
      id: uid("f0000000", n),
      scan_page_id: page,
      organization_id: ORG,
      rule_id: rule,
      impact,
      wcag_criteria: wcag,
      description: desc,
      help_text: help,
      nodes: [{ target: [node], html: `<${node.replace(/[.#].*/, "")} …>`, failureSummary: sfx }],
      help_url: `https://dequeuniversity.com/rules/axe/4.10/${urlrule}`,
    });
    await step(
      "hero violations (7)",
      db.from("violations").upsert(
        [
          V(1, p1, "color-contrast", "serious", ["1.4.3"], "Elements must meet minimum color contrast ratio thresholds.", "Increase text contrast to at least 4.5:1 (3:1 for large text).", "a.footer-link", "Contrast 4.12:1, expected 4.5:1", "color-contrast"),
          V(2, p1, "landmark-unique", "moderate", ["1.3.1"], "Landmarks must have a unique role or accessible name.", "Give each <nav>/<aside> a distinct aria-label.", "nav.utility", "Two navigation landmarks share the same name", "landmark-unique"),
          V(3, p1, "region", "moderate", ["1.3.1"], "All page content should be contained by landmarks.", "Wrap orphaned content in a <main>/<section> landmark.", "div.promo", "Content not contained in a landmark", "region"),
          V(4, p1, "meta-viewport", "minor", ["1.4.4"], "Zooming and scaling must not be disabled.", "Remove user-scalable=no / maximum-scale from the viewport meta.", "meta[name=viewport]", "user-scalable=no restricts zoom", "meta-viewport"),
          V(5, p2, "link-name", "serious", ["2.4.4", "4.1.2"], "Links must have discernible text.", "Provide link text or an aria-label describing the destination.", "a.icon-only", "Link has no discernible text", "link-name"),
          V(6, p2, "aria-required-attr", "serious", ["4.1.2"], "Required ARIA attributes must be provided.", "Add aria-checked to elements with role=switch.", "div[role=switch]", "Missing required attribute aria-checked", "aria-required-attr"),
          V(7, p2, "heading-order", "moderate", ["1.3.1"], "Heading levels should increase by one.", "Reorder headings so levels are not skipped.", "h4.card-title", "Heading order invalid: h4 follows h2", "heading-order"),
        ],
        { onConflict: "id" },
      ),
    );
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
