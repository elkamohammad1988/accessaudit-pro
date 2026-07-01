"use client";

import type { ScanStatus } from "@accessaudit/shared";
import { STATUS_META } from "@/lib/scan-format";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/provider";

/** The canonical scan-status pill, shared by the dashboard, lists, and detail. */
export function ScanStatusBadge({
  status,
  className,
}: {
  status: ScanStatus;
  className?: string;
}) {
  const t = useTranslations("scans");
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {/* Leading status dot — pulses while the scan is still live (queued/running). */}
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {!meta.terminal ? (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", meta.dot)} />
        ) : null}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", meta.dot)} />
      </span>
      {t("status." + status)}
    </span>
  );
}
