import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "critical"
  | "serious"
  | "moderate"
  | "minor";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-brand/10 text-brand",
  secondary: "border-transparent bg-muted text-muted-foreground",
  outline: "border-border text-foreground",
  success: "border-transparent bg-success/10 text-success ring-1 ring-inset ring-success/20",
  warning: "border-transparent bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
  danger: "border-transparent bg-danger/10 text-danger ring-1 ring-inset ring-danger/20",
  // Accessibility-impact scale — shared by report views and badges.
  critical: "border-transparent bg-critical/10 text-critical ring-1 ring-inset ring-critical/25",
  serious: "border-transparent bg-serious/10 text-serious ring-1 ring-inset ring-serious/25",
  moderate: "border-transparent bg-moderate/10 text-moderate ring-1 ring-inset ring-moderate/25",
  minor: "border-transparent bg-minor/10 text-minor ring-1 ring-inset ring-minor/25",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
