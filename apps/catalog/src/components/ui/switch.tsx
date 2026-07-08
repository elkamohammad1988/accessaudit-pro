"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  className?: string;
}

/** An accessible toggle switch (role=switch). */
export function Switch({ checked, onChange, label, id, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-brand" : "bg-muted-foreground/35",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-premium",
          checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
