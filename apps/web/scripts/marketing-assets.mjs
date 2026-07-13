/*
 * Marketing / portfolio asset generator.
 *
 * 1. Refreshes the 5 tracked README hero stills (docs/screenshots/*.png) at a
 *    README-appropriate size from the running demo build.
 * 2. Captures small source stills, then renders cinematic DEVICE-MOCKUP
 *    compositions (laptop / phone / monitor / device-family) by drawing CSS
 *    device frames around base64-embedded screenshots — saved to
 *    apps/web/portfolio/video-assets/.
 *
 * Usage:  BASE_URL=http://localhost:4319 node apps/web/scripts/marketing-assets.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:4319";
const ROOT = process.cwd(); // apps/web
const DOCS = resolve(ROOT, "../../docs/screenshots");
const VID = resolve(ROOT, "portfolio/video-assets");
const TMP = resolve(ROOT, "portfolio/_src");
mkdirSync(DOCS, { recursive: true });
mkdirSync(VID, { recursive: true });
mkdirSync(TMP, { recursive: true });

const SCAN = "d0000000-0000-0000-0000-000000000014";
const TOKEN = "pxpnmeridianbankingportalreport01";
const CLIENT = "c0000000-0000-0000-0000-000000000003";

const browser = await chromium.launch();

async function grab(path, theme, size, { full = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    deviceScaleFactor: size.dsf,
    colorScheme: theme,
    reducedMotion: "reduce",
    isMobile: !!size.mobile,
    hasTouch: !!size.mobile,
    userAgent: size.mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      : undefined,
  });
  await ctx.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(1600);
  const buf = await page.screenshot({ fullPage: full, type: size.type || "png", quality: size.quality });
  await ctx.close();
  return buf;
}

// ── 1. README heroes (tracked docs/screenshots) — 1600×900, crisp but repo-friendly.
const HERO = { w: 1600, h: 900, dsf: 1 };
const heroes = [
  ["hero-landing.png", "/", "dark"],
  ["dashboard-dark.png", "/dashboard", "dark"],
  ["dashboard-light.png", "/dashboard", "light"],
  ["scan-report-dark.png", `/scans/${SCAN}`, "dark"],
  ["shared-report-dark.png", `/r/${TOKEN}`, "dark"],
];
console.log("Refreshing README heroes → docs/screenshots");
for (const [file, path, theme] of heroes) {
  const buf = await grab(path, theme, HERO);
  writeFileSync(resolve(DOCS, file), buf);
  console.log(`  ✓ ${file} (${Math.round(buf.length / 1024)} KB)`);
}

// ── 2. Source stills for mockups (small JPEGs, base64-embedded into frames).
const DESK = { w: 1440, h: 900, dsf: 1, type: "jpeg", quality: 82 };
const PHONE = { w: 390, h: 844, dsf: 2, mobile: true, type: "jpeg", quality: 82 };
async function src(path, theme, size) {
  return (await grab(path, theme, size)).toString("base64");
}
console.log("Capturing mockup sources");
const img = {
  landingDark: await src("/", "dark", DESK),
  dashDark: await src("/dashboard", "dark", DESK),
  dashLight: await src("/dashboard", "light", DESK),
  scanDark: await src(`/scans/${SCAN}`, "dark", DESK),
  pricingLight: await src("/pricing", "light", DESK),
  mLandingDark: await src("/", "dark", PHONE),
  mDashDark: await src("/dashboard", "dark", PHONE),
};
const uri = (b64) => `data:image/jpeg;base64,${b64}`;

// ── 3. Composition rendering. Each scene is an HTML string; we render at 2× DPR.
async function render(name, html, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(VID, name), type: "png" });
  await ctx.close();
  console.log(`  ✓ ${name}`);
}

const FONTS = `font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;`;
// Warm charcoal → gold ambient stage, matching the product identity.
const STAGE_DARK = `background:radial-gradient(120% 120% at 50% -10%,#2a2320 0%,#14110f 55%,#0a0908 100%);`;
const STAGE_LIGHT = `background:radial-gradient(120% 120% at 50% -10%,#fbf7f0 0%,#f3ede2 60%,#efe7d9 100%);`;
const GOLD = "#d9b45a";

function laptop(imgUri, { dark = true } = {}) {
  // MacBook-style: lid (screen) + hinge base. Screen holds a 16:10-cropped shot.
  return `
  <div style="position:relative;width:900px;">
    <div style="background:linear-gradient(180deg,#3a3a3d,#1c1c1e);border-radius:22px;padding:14px 14px 16px;box-shadow:0 40px 90px -20px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06) inset;">
      <div style="border-radius:10px;overflow:hidden;background:#000;aspect-ratio:16/10;">
        <img src="${imgUri}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block;"/>
      </div>
    </div>
    <div style="height:14px;background:linear-gradient(180deg,#c7c9cc,#8a8d91);border-radius:0 0 10px 10px;margin:0 -26px;box-shadow:0 20px 30px -12px rgba(0,0,0,.5);position:relative;">
      <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:120px;height:7px;background:#6c6f73;border-radius:0 0 8px 8px;"></div>
    </div>
  </div>`;
}
function phone(imgUri) {
  // iPhone-style: rounded body, dynamic-island pill, screenshot fills the screen.
  return `
  <div style="position:relative;width:250px;border-radius:44px;padding:11px;background:linear-gradient(160deg,#2b2b2e,#131315);box-shadow:0 40px 80px -22px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.07) inset;">
    <div style="position:relative;border-radius:34px;overflow:hidden;background:#000;aspect-ratio:390/844;">
      <img src="${imgUri}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block;"/>
      <div style="position:absolute;top:11px;left:50%;transform:translateX(-50%);width:82px;height:22px;background:#000;border-radius:14px;"></div>
    </div>
  </div>`;
}
function monitor(imgUri) {
  return `
  <div style="width:1000px;">
    <div style="background:linear-gradient(180deg,#2a2a2d,#151517);border-radius:16px;padding:16px;box-shadow:0 44px 100px -24px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.05) inset;">
      <div style="border-radius:8px;overflow:hidden;background:#000;aspect-ratio:16/9;">
        <img src="${imgUri}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block;"/>
      </div>
    </div>
    <div style="width:120px;height:60px;margin:0 auto;background:linear-gradient(180deg,#3a3a3d,#242426);clip-path:polygon(30% 0,70% 0,88% 100%,12% 100%);"></div>
    <div style="width:260px;height:12px;margin:0 auto;background:#2a2a2d;border-radius:8px;"></div>
  </div>`;
}
function browserFrame(imgUri, dark = true) {
  const bar = dark ? "#1b1815" : "#ece5d8";
  const dot = ["#ff5f57", "#febc2e", "#28c840"];
  return `
  <div style="width:1000px;border-radius:14px;overflow:hidden;box-shadow:0 44px 100px -24px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06);">
    <div style="height:40px;background:${bar};display:flex;align-items:center;gap:8px;padding:0 16px;">
      ${dot.map((c) => `<span style="width:12px;height:12px;border-radius:50%;background:${c};"></span>`).join("")}
      <div style="margin-left:14px;height:22px;flex:1;max-width:360px;border-radius:11px;background:${dark ? "#0e0c0a" : "#fff"};display:flex;align-items:center;padding:0 12px;color:${GOLD};font-size:12px;${FONTS}">accessaudit-pro.vercel.app</div>
    </div>
    <img src="${imgUri}" style="width:100%;display:block;"/>
  </div>`;
}
function stage(inner, { dark = true, w = 1600, h = 900, tag = "" } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}</style></head>
  <body style="width:${w}px;height:${h}px;${dark ? STAGE_DARK : STAGE_LIGHT}display:flex;align-items:center;justify-content:center;overflow:hidden;${FONTS}">
    ${tag}
    ${inner}
  </body></html>`;
}
const wordmark = (dark = true) => `
  <div style="position:absolute;top:54px;left:0;right:0;text-align:center;color:${dark ? "#f3ece0" : "#2a2320"};${FONTS}">
    <div style="font-size:30px;font-weight:700;letter-spacing:-.02em;">AccessAudit <span style="color:${GOLD}">Pro</span></div>
    <div style="font-size:15px;opacity:.72;margin-top:6px;">On-demand WCAG 2.2 audits &amp; white-label reports for agencies</div>
  </div>`;

console.log("Rendering device mockups → portfolio/video-assets");
// Scene 1 — laptop, dashboard (dark). Flagship.
await render("01-laptop-dashboard-dark.png",
  stage(`<div style="margin-top:60px;">${laptop(uri(img.dashDark))}</div>`, { tag: wordmark(true) }), 1600, 900);
// Scene 2 — laptop, landing (dark).
await render("02-laptop-landing-dark.png",
  stage(`<div style="margin-top:20px;">${laptop(uri(img.landingDark))}</div>`), 1600, 900);
// Scene 3 — phone, mobile landing (dark).
await render("03-phone-landing-dark.png",
  stage(`${phone(uri(img.mLandingDark))}`, { w: 900, h: 1100 }), 900, 1100);
// Scene 4 — monitor, scan report (dark).
await render("04-monitor-scan-report-dark.png",
  stage(`<div style="margin-top:30px;">${monitor(uri(img.scanDark))}</div>`, { w: 1600, h: 1050 }), 1600, 1050);
// Scene 5 — browser + phone hero combo (dark).
await render("05-hero-combo-dark.png",
  stage(`<div style="position:relative;">
      ${browserFrame(uri(img.landingDark), true)}
      <div style="position:absolute;right:-70px;bottom:-60px;transform:scale(.8);">${phone(uri(img.mDashDark))}</div>
    </div>`, { tag: wordmark(true), w: 1600, h: 950 }), 1600, 950);
// Scene 6 — laptop, dashboard (light / day theme).
await render("06-laptop-dashboard-light.png",
  stage(`<div style="margin-top:60px;">${laptop(uri(img.dashLight))}</div>`, { dark: false, tag: wordmark(false) }), 1600, 900);
// Scene 7 — device family: monitor + laptop + phone together (dark).
await render("07-device-family-dark.png",
  stage(`<div style="display:flex;align-items:flex-end;gap:0;transform:scale(.92);">
      <div style="transform:scale(.62) translateX(60px);opacity:.98;">${monitor(uri(img.scanDark))}</div>
      <div style="transform:scale(.82) translateX(-40px);z-index:2;">${laptop(uri(img.dashDark))}</div>
      <div style="transform:scale(.72) translateX(-30px);z-index:3;">${phone(uri(img.mLandingDark))}</div>
    </div>`, { tag: wordmark(true), w: 1800, h: 1000 }), 1800, 1000);
// Scene 8 — phone, mobile dashboard (dark).
await render("08-phone-dashboard-dark.png",
  stage(`${phone(uri(img.mDashDark))}`, { w: 900, h: 1100 }), 900, 1100);

await browser.close();
console.log("\nDone. Heroes → docs/screenshots ; mockups → portfolio/video-assets");
