"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry when configured; the SDK is loaded lazily so it stays out
    // of the bundle when no DSN is set. Always keep a local console trace.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center space-y-4 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger-strong ring-1 ring-inset ring-danger/20">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        We hit an unexpected error loading this page. Try again, or head back to your dashboard.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button type="button" onClick={reset}>
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <ButtonLink href="/dashboard" variant="secondary">
          Go to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
