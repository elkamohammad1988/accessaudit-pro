"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Root error boundary for the public surfaces (marketing / legal / auth). The
 * authed app has its own `(app)/error.tsx`; this keeps a thrown error inside the
 * site chrome instead of falling through to the bare `global-error` document.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger-strong ring-1 ring-inset ring-danger/20">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We hit an unexpected error. Try again, or head back to the homepage.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={reset}>
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
