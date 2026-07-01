/*
 * Upwork cover-image generator. Composites a captured product screenshot into a
 * premium, on-brand marketing frame (warm-graphite "Bronze Atelier" background,
 * gold accents, browser-card mockup) and renders each at an exact size with a
 * real Chromium at 2× DPR.
 *
 * Needs portfolio/screenshots to exist first (run capture.mjs).
 * Usage:  node apps/web/scripts/covers.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd(), "portfolio");
const OUT = resolve(ROOT, "covers");
mkdirSync(OUT, { recursive: true });
// Inline as a data URI — setContent runs on about:blank, which blocks file:// subresources.
const shot = (f) => `data:image/png;base64,${readFileSync(resolve(ROOT, "screenshots", f)).toString("base64")}`;

const MARK = `<svg viewBox="0 0 32 32" width="46" height="46" fill="none" aria-hidden="true">
  <rect x="0" y="0" width="32" height="32" rx="9" fill="hsl(18 74% 56%)"/>
  <rect x="0.9" y="0.9" width="30.2" height="30.2" rx="8.2" fill="none" stroke="hsl(0 0% 100% / .2)" stroke-width="1.4"/>
  <path d="M9.6 23.4 L16 8.6 L22.4 23.4" stroke="hsl(24 35% 7%)" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.5 18 L19.5 18" stroke="hsl(42 64% 56%)" stroke-width="2.7" stroke-linecap="round"/>
</svg>`;

const badge = (t) => `<span class="badge">${t}</span>`;

function html({ w, h, layout, img, title, sub, badges }) {
  const card = `<div class="card"><div class="bar"><i></i><i></i><i></i></div><img src="${img}" alt=""/></div>`;
  const copy = `
    <div class="brand">${MARK}<span class="word">AccessAudit<b> Pro</b></span></div>
    <h1>${title}</h1>
    <p>${sub}</p>
    <div class="badges">${badges.map(badge).join("")}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');
    *{margin:0;box-sizing:border-box}
    html,body{width:${w}px;height:${h}px}
    body{font-family:Inter,system-ui,sans-serif;color:hsl(38 22% 91%);
      background:
        radial-gradient(60% 60% at 12% -10%, hsl(18 74% 56% / .16), transparent 60%),
        radial-gradient(50% 55% at 100% 10%, hsl(42 64% 56% / .12), transparent 60%),
        radial-gradient(90% 90% at 50% 130%, hsl(18 38% 7% / .7), transparent 70%),
        hsl(24 14% 6%);
      overflow:hidden}
    .stage{width:100%;height:100%;display:flex;gap:${layout==="banner"?"40px":"56px"};padding:${layout==="square"?"76px":"64px"};
      align-items:center;${layout==="square"?"flex-direction:column;text-align:center":""}}
    .copy{flex:${layout==="banner"?"1.1":"1"};min-width:0;${layout==="square"?"align-items:center":""};display:flex;flex-direction:column;gap:22px}
    .brand{display:flex;align-items:center;gap:14px}
    .word{font-weight:800;font-size:${layout==="banner"?26:30}px;letter-spacing:-.02em}
    .word b{color:hsl(44 84% 66%);font-weight:800}
    h1{font-weight:800;letter-spacing:-.03em;line-height:1.04;
      font-size:${layout==="banner"?42:layout==="thumb"?46:layout==="square"?60:64}px}
    h1 .g{color:hsl(44 84% 66%)}
    p{color:hsl(36 12% 70%);line-height:1.5;max-width:${layout==="square"?"640px":"560px"};
      font-size:${layout==="thumb"?18:22}px}
    .badges{display:flex;gap:12px;flex-wrap:wrap;${layout==="square"?"justify-content:center":""}}
    .badge{border:1px solid hsl(42 64% 56% / .35);color:hsl(44 72% 78%);border-radius:999px;
      padding:8px 16px;font-size:${layout==="thumb"?14:16}px;font-weight:500;
      background:hsl(42 64% 56% / .06)}
    .mock{flex:${layout==="banner"?"1":"1.15"};display:flex;justify-content:center;align-items:center;min-width:0}
    .card{width:100%;border-radius:16px;overflow:hidden;border:1px solid hsl(42 64% 56% / .18);
      box-shadow:0 40px 100px -30px hsl(20 40% 2% / .8), 0 0 0 1px hsl(0 0% 100% / .04) inset;
      background:hsl(26 16% 9%);transform:${layout==="square"?"none":"perspective(1600px) rotateY(-9deg) rotateX(2deg)"}}
    .bar{height:34px;background:hsl(28 14% 12%);display:flex;align-items:center;gap:9px;padding:0 16px;
      border-bottom:1px solid hsl(30 14% 17%)}
    .bar i{width:11px;height:11px;border-radius:50%;background:hsl(30 12% 26%)}
    .card img{width:100%;display:block}
  </style></head><body>
    <div class="stage">
      ${layout==="square"?copy+`<div class="mock">${card}</div>`
        : layout==="mockLeft"?`<div class="mock">${card}</div>`+`<div class="copy">${copy}</div>`
        : `<div class="copy">${copy}</div><div class="mock">${card}</div>`}
    </div>
  </body></html>`;
}

const T = `WCAG&nbsp;2.2 audits your clients can <span class="g">actually read</span>.`;
const SUB = "On-demand accessibility scans → prioritized, white-label reports. A multi-tenant SaaS built for agencies — not just developers.";
const BADGES = ["Enterprise SaaS", "Automated WCAG 2.2 AA", "White-label reports", "Multi-tenant · RLS"];

const covers = [
  { name: "cover-landscape-hero", w: 1600, h: 900, layout: "default", img: shot("01-landing__dark__16x9.png"), title: T, sub: SUB, badges: BADGES },
  { name: "cover-square", w: 1200, h: 1200, layout: "square", img: shot("05-shared-report__dark__4x3.png"), title: T, sub: SUB, badges: BADGES.slice(0, 3) },
  { name: "cover-thumbnail", w: 800, h: 600, layout: "thumb", img: shot("05-shared-report__dark__16x9.png"), title: `Accessibility reports, <span class="g">client-ready</span>.`, sub: "Scored, prioritized, WCAG-mapped — white-labeled.", badges: ["Enterprise SaaS", "WCAG 2.2 AA"] },
  { name: "cover-banner", w: 1500, h: 500, layout: "banner", img: shot("01-landing__dark__16x9.png"), title: `WCAG&nbsp;2.2 audits, <span class="g">client-ready</span>.`, sub: "Automated scans → white-label reports. Built for agencies.", badges: ["Enterprise SaaS", "Multi-tenant"] },
];

const browser = await chromium.launch();
console.log(`Rendering ${covers.length} covers → portfolio/covers\n`);
for (const c of covers) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html(c), { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: resolve(OUT, `${c.name}.png`) });
  console.log(`  ✓ ${c.name}.png  (${c.w}×${c.h} @2×)`);
  await ctx.close();
}
await browser.close();
console.log("\nDone.");
