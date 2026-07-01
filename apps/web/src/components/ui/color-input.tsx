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
      // Shares the premium `.field` surface so the swatch reads as one system
      // with the text controls; the inner swatch is rounded to match.
      className={cn(
        "field h-11 w-14 cursor-pointer rounded-2xl p-1",
        "[&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-0",
        className,
      )}
      {...props}
    />
  ),
);
ColorInput.displayName = "ColorInput";
