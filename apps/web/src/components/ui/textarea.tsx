import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      // Shared premium surface (.field); relaxed leading so multi-line ink
      // breathes. Sizing/shape stays here and remains overridable.
      className={cn(
        "field flex w-full resize-y rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
