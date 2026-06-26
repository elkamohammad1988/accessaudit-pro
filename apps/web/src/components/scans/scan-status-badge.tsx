import type { ScanStatus } from "@accessaudit/shared";
import { STATUS_META } from "@/lib/scan-format";
import { cn } from "@/lib/utils";

/** The canonical scan-status pill, shared by the dashboard, lists, and detail. */
export function ScanStatusBadge({
  status,
  className,
}: {
  status: ScanStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
