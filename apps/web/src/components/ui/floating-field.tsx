import * as React from "react";
import { cn } from "@/lib/utils";

type ControlProps = {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-describedby"?: string;
};

export interface FloatingFieldProps {
  /** Wired to the control's `id` and the label's `htmlFor` (and the hint's id). */
  id: string;
  /** The label that rests as a placeholder, then floats on focus / when filled. */
  label: string;
  /** Optional helper text rendered under the control and linked via aria. */
  hint?: React.ReactNode;
  className?: string;
  /** A single control element — typically an <Input> (or <Textarea>). */
  children: React.ReactElement<ControlProps>;
}

/**
 * A premium floating-label wrapper. The label sits centered like a placeholder,
 * then lifts and shrinks with an elegant spring as soon as the field is focused
 * or holds a value. Purely presentational — it injects the `id`/`peer` wiring
 * and a blank placeholder (so `:placeholder-shown` drives the motion) onto the
 * control without touching its `name`, type, validation, or any other behavior.
 */
export function FloatingField({ id, label, hint, className, children }: FloatingFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  const control = React.cloneElement(children, {
    id,
    // A single space keeps `:placeholder-shown` true while empty so nothing shows
    // behind the resting label — the label *is* the placeholder.
    placeholder: " ",
    "aria-describedby": hintId ?? children.props["aria-describedby"],
    className: cn("peer h-14 pt-6 pb-1", children.props.className),
  });

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative">
        {control}
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute start-3.5 top-1/2 z-10 -translate-y-1/2 text-sm text-muted-foreground",
            "transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            // Floated state (focused): lift, shrink, tint with the brand.
            "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-brand",
            // Floated state (filled but blurred): stay lifted, high-contrast ink.
            "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-foreground/80",
          )}
        >
          {label}
        </label>
      </div>
      {hint ? (
        <p id={hintId} className="px-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
