import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      // Surface, depth, focus bloom, ink typography, caret, selection and
      // autofill all come from the shared `.field` class (see globals.css);
      // only sizing/shape lives here so callers can still override it.
      className={cn("field flex h-11 w-full rounded-2xl px-3.5 text-sm", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
