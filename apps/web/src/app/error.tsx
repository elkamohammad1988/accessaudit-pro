"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { IconChip } from "@/components/ui/icon-chip";
import { useTranslations } from "@/i18n/provider";

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
  const t = useTranslations("errors.generic");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <IconChip icon={AlertTriangle} tone="danger" size="lg" glow />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("body")}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={reset}>
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {t("retry")}
        </Button>
        <ButtonLink href="/" variant="secondary">
          {t("home")}
        </ButtonLink>
      </div>
    </div>
  );
}
