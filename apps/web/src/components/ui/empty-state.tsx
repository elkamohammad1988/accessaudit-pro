import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "bg-dot-grid relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-brand/15 to-brand/5 text-brand shadow-sm ring-1 ring-inset ring-brand/20">
          <span
            aria-hidden="true"
            className="absolute -inset-2 -z-10 rounded-3xl bg-brand/10 blur-xl"
          />
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <p className="text-base font-semibold tracking-tight">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>
      ) : null}
    </div>
  );
}
