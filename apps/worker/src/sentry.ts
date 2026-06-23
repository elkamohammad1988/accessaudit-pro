/**
 * Worker observability. Initializes Sentry at import time when SENTRY_DSN is set;
 * with no DSN everything below is a no-op, so local runs and un-instrumented
 * environments stay silent. Import this module first in index.ts so the SDK is
 * initialized before anything it instruments.
 */
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    // Errors only — no performance tracing for the worker.
    tracesSampleRate: 0,
  });
}

/** Report an exception. No-op without a DSN. */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!dsn) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

/** Drain buffered events before the process exits. Safe to call unconditionally. */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!dsn) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch {
    /* best-effort on shutdown */
  }
}
