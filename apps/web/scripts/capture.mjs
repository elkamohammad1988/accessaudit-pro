/*
 * Portfolio screenshot capture. Drives the running production server with a real
 * Chromium (Playwright) and saves crisp (2–3× DPR) stills of each route in light
 * and dark, at portfolio aspect ratios. Reduced-motion is forced so entrances are
 * captured fully settled (no mid-animation frames).
 *
 * Usage:  BASE_URL=http://localhost:4319 node apps/web/scripts/capture.mjs [group]
 *   group = "public" (default) or "app" (authed — needs a working login).
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:4319";
const GROUP = process.argv[2] || "public";
const OUT = resolve(process.cwd(), "portfolio/screenshots");
mkdirSync(OUT, { recursive: true });

const PUBLIC = [
  { name: "01-landing", path: "/", hero: true },
  { name: "02-pricing", path: "/pricing" },
  { name: "03-guides", path: "/guides" },
  { name: "04-sample-report", path: "/sample", hero: true },
  { name: "05-shared-report", path: "/r/pxpnmeridianbankingportalreport01", hero: true },
  { name: "06-login", path: "/login" },
  { name: "07-signup", path: "/signup" },
];
const APP = [
  { name: "10-dashboard", path: "/dashboard", hero: true },
  { name: "11-clients", path: "/clients" },
  { name: "12-projects", path: "/projects" },
  { name: "13-scan-report", path: "/scans" },
  { name: "14-settings", path: "/settings" },
  { name: "15-billing", path: "/settings/billing" },
];
const routes = GROUP === "app" ? APP : PUBLIC;

const SIZES = [
  { tag: "16x9", w: 1920, h: 1080, dsf: 2, mobile: false },
  { tag: "mobile", w: 390, h: 844, dsf: 3, mobile: true },
];
const HERO_SIZES = [
  { tag: "4x3", w: 1600, h: 1200, dsf: 2, mobile: false },
  { tag: "1x1", w: 1200, h: 1200, dsf: 2, mobile: false },
];

async function shoot(browser, route, theme, size) {
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
  await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1300); // let charts/gauges settle in their final (drawn) state
  const file = `${route.name}__${theme}__${size.tag}.png`;
  await page.screenshot({ path: resolve(OUT, file), fullPage: false });
  console.log(`  ✓ ${file}${errors.length ? `   ⚠ ${errors.length} console error(s)` : ""}`);
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
  }
}
await browser.close();
console.log(`\nDone. ${totalErr === 0 ? "No console errors." : totalErr + " console error(s) across captures — see above."}`);
