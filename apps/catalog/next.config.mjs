/*
 * Verdant — a self-contained premium product catalogue.
 *
 * No backend: every screen is driven by a local mock dataset and client state
 * (favourites, theme, language, toasts). The security headers below are the same
 * hardened set a real storefront would ship — the app never reaches off-origin
 * (product visuals are generated, fonts are self-hosted by next/font), so the CSP
 * can stay tight.
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
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Barrel-optimise the icon set so only referenced glyphs compile.
  experimental: { optimizePackageImports: ["lucide-react"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
