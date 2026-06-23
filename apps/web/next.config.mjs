import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TS; let Next transpile them.
  transpilePackages: ["@accessaudit/shared", "@accessaudit/database"],
  typedRoutes: true,
};

// Wrap with Sentry so the build externalizes the Sentry/OpenTelemetry server SDK
// (silences the harmless "Critical dependency" webpack warnings). Runtime Sentry
// stays gated on a DSN (see instrumentation*.ts), so this is inert without one.
// Add `org`/`project` + a SENTRY_AUTH_TOKEN later to upload source maps.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
