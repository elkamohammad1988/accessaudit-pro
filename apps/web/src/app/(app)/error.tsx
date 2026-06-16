"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for observability (wire to Sentry at go-live).
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        We hit an unexpected error loading this page. Try again, or head back to your dashboard.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-[hsl(var(--muted))]"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
