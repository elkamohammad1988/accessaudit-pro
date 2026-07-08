"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  count?: number;
  className?: string;
}

/** A labelled checkbox row for filter facets. The whole row is the hit target. */
export function Checkbox({ checked, onChange, label, count, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent",
        className,
      )}
    >
      <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-all duration-150",
            "border-input bg-card peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
            checked && "border-brand bg-brand text-brand-fg",
          )}
          aria-hidden
        >
          {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
      </span>
      <span className="flex-1 text-foreground">{label}</span>
      {count != null ? (
        <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
      ) : null}
    </label>
  );
}
