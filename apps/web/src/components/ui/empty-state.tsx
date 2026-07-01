import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconChip } from "@/components/ui/icon-chip";

/**
 * Consistent empty state: a soft icon medallion, a title, supporting copy, and an
 * optional call to action. Used wherever a list or section has no data yet, so
 * "nothing here" always reads as an invitation rather than a dead end.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? <IconChip icon={Icon} tone="brand" size="lg" glow className="mb-5" /> : null}
      <p className="text-base font-semibold tracking-tight">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{action}</div>
      ) : null}
    </div>
  );
}
