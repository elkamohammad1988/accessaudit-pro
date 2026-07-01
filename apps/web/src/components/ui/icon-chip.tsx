import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IconChip — the app's one premium icon treatment.
 *
 * A lucide glyph rendered as lit enamel rather than a bare line icon: a soft
 * tinted fill, an inset hairline ring in the same color family, a top gloss
 * highlight (the catch-light that makes it read as a physical, domed surface),
 * and — with `glow` — a blurred duotone copy of the glyph behind it so the icon
 * appears to emit a little light. In dark mode the ring warms toward gold and a
 * faint colored halo blooms on hover of the parent `.group`.
 *
 * The chip and glyph are decorative (`aria-hidden`); the surrounding control
 * carries the accessible name. Every color pairing is AA-legible, and the glow
 * is opacity/blur only (no motion), so reduced-motion users lose nothing.
 */

type Tone = "brand" | "gold" | "muted" | "success" | "warning" | "danger";
type Size = "sm" | "md" | "lg";

const chipSize: Record<Size, string> = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-12 w-12 rounded-2xl",
};

const glyphSize: Record<Size, string> = {
  sm: "h-4 w-4",
  md: "h-[1.15rem] w-[1.15rem]",
  lg: "h-6 w-6",
};

// Fill + ink + inset ring per tone. Dark warms the ring toward the tone's metal
// and lifts the fill a touch so the enamel glows against the graphite.
const chipTone: Record<Tone, string> = {
  brand:
    "bg-brand/10 text-brand ring-brand/20 dark:bg-brand/15 dark:text-brand dark:ring-brand/30",
  gold:
    "bg-gold/10 text-gold-strong ring-gold/25 dark:bg-gold/[0.14] dark:text-gold-strong dark:ring-gold/35",
  muted:
    "bg-muted text-muted-foreground ring-border dark:bg-muted/70 dark:ring-white/10",
  success:
    "bg-success/10 text-success-strong ring-success/20 dark:bg-success/15 dark:ring-success/30",
  warning:
    "bg-warning/10 text-warning-strong ring-warning/20 dark:bg-warning/15 dark:ring-warning/30",
  danger:
    "bg-danger/10 text-danger-strong ring-danger/20 dark:bg-danger/15 dark:ring-danger/30",
};

// Soft colored halo that blooms when an ancestor `.group` is hovered (dark only,
// where glows read as light rather than smudge).
const chipGlow: Record<Tone, string> = {
  brand: "dark:group-hover:shadow-[0_0_18px_-2px_hsl(var(--brand)/0.5)]",
  gold: "dark:group-hover:shadow-[0_0_18px_-2px_hsl(var(--gold)/0.5)]",
  muted: "dark:group-hover:shadow-[0_0_16px_-3px_hsl(var(--gold)/0.35)]",
  success: "dark:group-hover:shadow-[0_0_18px_-2px_hsl(var(--success)/0.5)]",
  warning: "dark:group-hover:shadow-[0_0_18px_-2px_hsl(var(--warning)/0.5)]",
  danger: "dark:group-hover:shadow-[0_0_18px_-2px_hsl(var(--danger)/0.5)]",
};

export function IconChip({
  icon: Icon,
  tone = "brand",
  size = "md",
  glow = false,
  className,
  ...props
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: Size;
  /** Render a blurred duotone copy behind the glyph for a luminous halo. */
  glow?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        "shadow-sm ring-1 ring-inset transition-[box-shadow,transform,background-color] duration-300",
        chipSize[size],
        chipTone[tone],
        chipGlow[tone],
        className,
      )}
      {...props}
    >
      {/* Catch-light: a soft highlight across the top third turns the flat tint
          into a domed, lit surface. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent dark:from-white/[0.10]"
      />
      {glow ? (
        <Icon
          className={cn("absolute opacity-40 blur-[6px]", glyphSize[size])}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      ) : null}
      <Icon className={cn("relative", glyphSize[size])} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
