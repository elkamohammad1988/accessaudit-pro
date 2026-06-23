/**
 * Next.js server/edge instrumentation. Auto-loaded by Next at startup.
 * Initializes Sentry for the Node and Edge runtimes when a DSN is configured;
 * with no DSN the SDK is never initialized, so this is a clean no-op in local
 * dev and in any environment where observability isn't wired up yet.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register(): Promise<void> {
  if (!dsn) return;

  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === "nodejs" || runtime === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      // Errors only for launch — no performance tracing (keeps event volume/cost low).
      tracesSampleRate: 0,
    });
  }
}

/** Forwards App Router server-side request errors (RSC, route handlers) to Sentry. */
export const onRequestError = Sentry.captureRequestError;
