import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      // Shared premium surface (.field). Sizing/shape stays here and remains
      // overridable per call site.
      className={cn("field flex h-11 w-full rounded-2xl px-3.5 text-sm", className)}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
