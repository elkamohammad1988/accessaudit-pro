"use client";

import dynamic from "next/dynamic";
import type { ScanStatus } from "@accessaudit/shared";
import { useTranslations } from "@/i18n/provider";

// The realtime/polling engine pulls in the Supabase Realtime client (~40 kB of
// WebSocket machinery). It only matters for an in-progress scan, so load it lazily
// and client-side only — terminal scans (the common view) never download it, and
// even non-terminal views ship it as a separate, deferred chunk.
const ScanSync = dynamic(() => import("./scan-sync").then((m) => m.ScanSync), {
  ssr: false,
});

/**
 * Keeps a non-terminal scan page in sync and announces status to assistive tech.
 * The visible-to-SR live region renders immediately (it needs no network code);
 * the heavy sync engine is deferred (see {@link ScanSync}). Renders nothing for a
 * terminal scan — callers already gate on that, but we double-guard here so the
 * deferred chunk is never even requested for a finished scan.
 */
export function ScanLive({ scanId, status }: { scanId: string; status: ScanStatus }) {
  const t = useTranslations("scans");
  const terminal = status === "completed" || status === "partial" || status === "failed";

  return (
    <>
      {!terminal ? <ScanSync scanId={scanId} /> : null}
      <p role="status" aria-live="polite" className="sr-only">
        {t("detail.liveStatus", { status: t("status." + status) })}
      </p>
    </>
  );
}
