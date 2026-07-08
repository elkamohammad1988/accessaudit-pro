import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconChip } from "@/components/ui/icon-chip";

/**
 * Consistent empty state — never a dead end, always an invitation. A floating,
 * glowing icon medallion rises out of a soft emerald light-pool (two blurred blobs
 * + a dotted "horizon" ring), over a frosted-glass well. A title, supporting copy,
 * and an optional call to action sit beneath. Used wherever a list or section has
 * no data yet.
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
        "relative isolate overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 to-card/40 px-6 py-14 text-center backdrop-blur-xl",
        "shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.7),var(--shadow-sm)]",
        "dark:border-white/10 dark:from-card/60 dark:to-card/30",
        className,
      )}
    >
      {/* Ambient light — two soft emerald blobs drifting behind the medallion. */}
      <span
        aria-hidden="true"
        className="blob blob-mint animate-blob absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 opacity-40"
      />
      <span
        aria-hidden="true"
        className="blob animate-float-slow absolute -bottom-16 right-6 h-32 w-32 opacity-25"
      />

      <div className="relative flex flex-col items-center">
        {Icon ? (
          <span className="relative mb-6 grid place-items-center">
            {/* Concentric halo rings behind the icon — a soft radar "horizon". */}
            <span
              aria-hidden="true"
              className="absolute h-24 w-24 rounded-full border border-brand/15"
            />
            <span
              aria-hidden="true"
              className="absolute h-16 w-16 rounded-full border border-brand/20"
            />
            <IconChip icon={Icon} tone="brand" size="lg" glow float />
          </span>
        ) : null}
        <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
        {description ? (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {action ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>
        ) : null}
      </div>
    </div>
  );
}
