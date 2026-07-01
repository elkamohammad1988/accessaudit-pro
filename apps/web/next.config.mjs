// Load the monorepo-root .env.local / .env into process.env. Next.js only reads
// env files from this app's own directory, so without this the single root env
// file (NEXT_PUBLIC_* included) would not be picked up in the Turborepo layout.
import "../../scripts/load-env.mjs";
import { withSentryConfig } from "@sentry/nextjs";

/*
 * Content-Security-Policy.
 *
 * `script-src`/`style-src` keep `'unsafe-inline'` because Next's App Router emits
 * inline hydration/bootstrap scripts (and we inject a tiny inline theme script to
 * avoid a flash of the wrong theme); Tailwind/`next/og` also emit inline styles.
 * Everything else is locked to same-origin plus the few cross-origins the app
 * genuinely needs:
 *   - img-src https:/data:/blob: — org & client logos from Supabase Storage, OG images.
 *   - connect-src https:/wss: — Supabase REST + Realtime (websockets) and Sentry ingest.
 * `frame-ancestors 'none'` stops the dashboard and public reports from being framed
 * (clickjacking). Tighten `script-src` to a per-request nonce as a later hardening step.
 *
 * `'unsafe-eval'` is added to `script-src` in development ONLY: Next.js dev mode
 * (React Refresh / Webpack HMR) evaluates strings as JS, which a strict CSP blocks.
 * `next build`/`next start` set NODE_ENV to "production", so production CSP stays
 * strict and never ships `'unsafe-eval'`.
 */
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`;

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace packages ship raw TS; let Next transpile them.
  transpilePackages: ["@accessaudit/shared", "@accessaudit/database"],
  typedRoutes: true,
  // Barrel-optimize the icon set so only used glyphs compile (faster dev builds,
  // guards against an accidental full-set pull); named imports already tree-shake.
  experimental: { optimizePackageImports: ["lucide-react"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Wrap with Sentry so the build externalizes the Sentry/OpenTelemetry server SDK
// (silences the harmless "Critical dependency" webpack warnings). Runtime Sentry
// stays gated on a DSN (see instrumentation*.ts), so this is inert without one.
// Add `org`/`project` + a SENTRY_AUTH_TOKEN later to upload source maps.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
