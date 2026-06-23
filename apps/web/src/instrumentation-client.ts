/**
 * Next.js client instrumentation. Auto-loaded by Next in the browser.
 * Initializes browser-side Sentry only when NEXT_PUBLIC_SENTRY_DSN is set. The
 * SDK is imported dynamically so that, with no DSN (the default), the branch is
 * dead-code-eliminated at build time and the heavy SDK never enters the bundle.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      // Errors only — no session replay or tracing for the MVP.
      tracesSampleRate: 0,
    });
  });
}
