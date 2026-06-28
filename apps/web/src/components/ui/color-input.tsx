import * as React from "react";
import { cn } from "@/lib/utils";

export type ColorInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Native color swatch, styled to match the form-control system (same border,
 * shadow, hover, and accessible focus ring as Input/Select). Used for org and
 * onboarding brand-color pickers so the control reads as one consistent system.
 */
export const ColorInput = React.forwardRef<HTMLInputElement, ColorInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="color"
      className={cn(
        "h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1 shadow-xs",
        "transition-colors hover:border-foreground/25",
        "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
        "[&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0",
        className,
      )}
      {...props}
    />
  ),
);
ColorInput.displayName = "ColorInput";
