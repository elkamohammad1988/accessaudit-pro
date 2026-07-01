"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { IconChip } from "@/components/ui/icon-chip";
import { useTranslations } from "@/i18n/provider";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.app");
  const tc = useTranslations("common");

  useEffect(() => {
    // Report to Sentry when configured; the SDK is loaded lazily so it stays out
    // of the bundle when no DSN is set. Always keep a local console trace.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center space-y-4 py-12 text-center">
      <IconChip icon={AlertTriangle} tone="danger" size="lg" glow />
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button type="button" onClick={reset}>
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {tc("actions.retry")}
        </Button>
        <ButtonLink href="/dashboard" variant="secondary">
          {t("dashboard")}
        </ButtonLink>
      </div>
    </div>
  );
}
