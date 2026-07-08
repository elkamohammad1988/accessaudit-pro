/*
 * Portfolio screenshot capture. Drives the running production server with a real
 * Chromium (Playwright) and saves crisp (2–3× DPR) stills of each route in light
 * and dark, at portfolio aspect ratios. Reduced-motion is forced so entrances are
 * captured fully settled (no mid-animation frames).
 *
 * Routes resolve against the local in-memory demo tenant (Pixel & Pine Studio) —
 * see lib/demo. Detail-page ids below are the seeded ids from lib/demo/store.ts
 * (client 3 = Meridian Financial, project 4 / scan 14 = the shared Meridian
 * Banking Portal report, the only scan with full page + violation detail).
 *
 * Usage:  BASE_URL=http://localhost:4319 node apps/web/scripts/capture.mjs [group]
 *   group = "public" (default), "app" (dashboard/clients/…), or "all".
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:4319";
const GROUP = process.argv[2] || "public";
const OUT = resolve(process.cwd(), "portfolio/screenshots");
mkdirSync(OUT, { recursive: true });

// Seeded demo ids (lib/demo/store.ts)
const CLIENT_MERIDIAN = "c0000000-0000-0000-0000-000000000003";
const PROJECT_BANKING = "b0000000-0000-0000-0000-000000000004";
const SCAN_HERO = "d0000000-0000-0000-0000-000000000014";
const SHARE_TOKEN = "pxpnmeridianbankingportalreport01";

const PUBLIC = [
  { name: "01-landing", path: "/", hero: true, full: true },
  { name: "02-pricing", path: "/pricing", hero: true, full: true },
  { name: "03-guides", path: "/guides" },
  { name: "04-guide-article", path: "/guides/wcag-2-2-aa-checklist", full: true },
  { name: "05-sample-report", path: "/sample", hero: true, full: true },
  { name: "06-shared-report", path: `/r/${SHARE_TOKEN}`, hero: true, full: true },
  { name: "07-login", path: "/login" },
  { name: "08-signup", path: "/signup" },
];
const APP = [
  { name: "10-dashboard", path: "/dashboard", hero: true, full: true },
  { name: "11-clients", path: "/clients" },
  { name: "12-client-detail", path: `/clients/${CLIENT_MERIDIAN}`, full: true },
  { name: "13-projects", path: "/projects" },
  { name: "14-project-detail", path: `/projects/${PROJECT_BANKING}`, hero: true, full: true },
  { name: "15-scan-report", path: `/scans/${SCAN_HERO}`, hero: true, full: true },
  { name: "16-new-scan", path: "/scans/new" },
  { name: "17-settings", path: "/settings" },
  { name: "18-billing", path: "/settings/billing" },
  { name: "19-new-client", path: "/clients/new" },
];
const routes = GROUP === "app" ? APP : GROUP === "all" ? [...PUBLIC, ...APP] : PUBLIC;

const SIZES = [
  { tag: "16x9", w: 1920, h: 1080, dsf: 2, mobile: false },
  { tag: "mobile", w: 390, h: 844, dsf: 3, mobile: true },
];
const HERO_SIZES = [
  { tag: "4x3", w: 1600, h: 1200, dsf: 2, mobile: false },
  { tag: "1x1", w: 1200, h: 1200, dsf: 2, mobile: false },
];
// Whole-page scroll capture. DPR 1: tall pages at 2× blow past Chromium's max
// screenshot surface (~16k device px) and fail; these are supplementary overview
// shots, so 1× at 1440 CSS width is plenty crisp and always succeeds.
const FULL_SIZE = { tag: "full", w: 1440, h: 900, dsf: 1, mobile: false };

async function shoot(browser, route, theme, size, { fullPage = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    deviceScaleFactor: size.dsf,
    colorScheme: theme,
    reducedMotion: "reduce",
    isMobile: size.mobile,
    hasTouch: size.mobile,
    userAgent: size.mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      : undefined,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  // `load` (not `networkidle`): the demo's live-scan realtime keeps a connection
  // open, so networkidle can never settle. We settle with an explicit pause.
  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: "load", timeout: 45000 });
  } catch (e) {
    errors.push(`goto: ${String(e).slice(0, 120)}`);
  }
  await page.waitForTimeout(1600); // let charts/gauges settle in their final (drawn) state
  const file = `${route.name}__${theme}__${size.tag}.png`;
  // Guard the screenshot too: a single oversized/failed frame must not abort the
  // whole batch. Log it and move on.
  try {
    await page.screenshot({ path: resolve(OUT, file), fullPage });
    console.log(`  ✓ ${file}${errors.length ? `   ⚠ ${errors.length} console error(s)` : ""}`);
  } catch (e) {
    console.log(`  ✗ ${file}   screenshot failed: ${String(e).slice(0, 120)}`);
    errors.push("screenshot-failed");
  }
  if (errors.length) errors.slice(0, 2).forEach((e) => console.log(`      · ${e.slice(0, 140)}`));
  await ctx.close();
  return errors.length;
}

const browser = await chromium.launch();
let totalErr = 0;
console.log(`Capturing "${GROUP}" from ${BASE} → portfolio/screenshots\n`);
for (const route of routes) {
  for (const theme of ["light", "dark"]) {
    for (const size of SIZES) totalErr += await shoot(browser, route, theme, size);
    if (route.hero) for (const size of HERO_SIZES) totalErr += await shoot(browser, route, theme, size);
    if (route.full) totalErr += await shoot(browser, route, theme, FULL_SIZE, { fullPage: true });
  }
}
await browser.close();
console.log(`\nDone. ${totalErr === 0 ? "No console errors." : totalErr + " console error(s) across captures — see above."}`);
