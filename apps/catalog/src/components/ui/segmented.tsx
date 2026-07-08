"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
  /** Show only the icon (label becomes the accessible name). */
  iconOnly?: boolean;
  className?: string;
}

/** A segmented control — the active segment lifts onto a white "chip". */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel,
  iconOnly = false,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={iconOnly ? opt.label : undefined}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm",
              iconOnly && (size === "sm" ? "w-8 px-0" : "w-9 px-0"),
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon className={size === "sm" ? "h-4 w-4" : "h-[1.05rem] w-[1.05rem]"} aria-hidden /> : null}
            {!iconOnly ? opt.label : null}
          </button>
        );
      })}
    </div>
  );
}
