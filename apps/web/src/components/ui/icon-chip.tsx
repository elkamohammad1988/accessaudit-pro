import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IconChip — the app's one premium icon treatment, and a load-bearing part of the
 * visual identity.
 *
 * A lucide glyph rendered as lit, domed enamel rather than a bare line icon: a
 * translucent gradient fill in the tone's color family, an inset hairline ring, a
 * top gloss catch-light (so it reads as a physical, rounded surface), and — with
 * `glow` — a soft colored halo plus a blurred duotone copy of the glyph behind it,
 * so the icon appears to emit light. `float` gives it a gentle, endless drift for
 * hero/empty-state contexts. On hover of an ancestor `.group` the halo blooms.
 *
 * The chip and glyph are decorative (`aria-hidden`); the surrounding control carries
 * the accessible name. Every color pairing is AA-legible, and the motion is
 * transform/opacity only, so reduced-motion users lose nothing.
 */

type Tone = "brand" | "gold" | "muted" | "success" | "warning" | "danger";
type Size = "sm" | "md" | "lg";

const chipSize: Record<Size, string> = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-11 w-11 rounded-2xl",
  lg: "h-14 w-14 rounded-[1.35rem]",
};

const glyphSize: Record<Size, string> = {
  sm: "h-[1.05rem] w-[1.05rem]",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

// Gradient fill + ink + inset ring per tone. A bright top-light stop fades into a
// deeper base so the enamel reads domed; ink is the AA-legible cut of the family.
const chipTone: Record<Tone, string> = {
  brand: "from-brand-2/30 to-brand/10 text-brand ring-brand/25 dark:from-brand-2/25 dark:to-brand/10 dark:text-brand dark:ring-brand/30",
  gold: "from-gold-2/35 to-gold/10 text-gold-strong ring-gold/30 dark:from-gold-2/25 dark:to-gold/10 dark:text-gold-strong dark:ring-gold/35",
  muted: "from-muted to-muted/60 text-muted-foreground ring-border dark:from-muted/70 dark:to-muted/40 dark:ring-white/10",
  success: "from-success/25 to-success/10 text-success-strong ring-success/25 dark:from-success/20 dark:to-success/10 dark:ring-success/30",
  warning: "from-warning/25 to-warning/10 text-warning-strong ring-warning/25 dark:from-warning/20 dark:to-warning/10 dark:ring-warning/30",
  danger: "from-danger/25 to-danger/10 text-danger-strong ring-danger/25 dark:from-danger/20 dark:to-danger/10 dark:ring-danger/30",
};

// Always-on soft colored halo when `glow` is set, deepening on ancestor `.group`
// hover — the icon reads as a small light source in both themes.
const chipGlow: Record<Tone, string> = {
  brand: "shadow-[0_6px_20px_-6px_hsl(var(--brand-2)/0.5)] group-hover:shadow-[0_10px_26px_-6px_hsl(var(--brand-2)/0.65)]",
  gold: "shadow-[0_6px_20px_-6px_hsl(var(--gold)/0.5)] group-hover:shadow-[0_10px_26px_-6px_hsl(var(--gold)/0.65)]",
  muted: "shadow-[0_6px_18px_-6px_hsl(var(--brand)/0.28)] group-hover:shadow-[0_10px_24px_-6px_hsl(var(--brand)/0.4)]",
  success: "shadow-[0_6px_20px_-6px_hsl(var(--success)/0.5)] group-hover:shadow-[0_10px_26px_-6px_hsl(var(--success)/0.65)]",
  warning: "shadow-[0_6px_20px_-6px_hsl(var(--warning)/0.5)] group-hover:shadow-[0_10px_26px_-6px_hsl(var(--warning)/0.65)]",
  danger: "shadow-[0_6px_20px_-6px_hsl(var(--danger)/0.5)] group-hover:shadow-[0_10px_26px_-6px_hsl(var(--danger)/0.65)]",
};

export function IconChip({
  icon: Icon,
  tone = "brand",
  size = "md",
  glow = false,
  float = false,
  className,
  ...props
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: Size;
  /** Render a soft colored halo + a blurred duotone glyph for a luminous look. */
  glow?: boolean;
  /** Gentle, endless drift — for hero and empty-state medallions. */
  float?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br",
        "ring-1 ring-inset transition-[box-shadow,transform,background-color] duration-300",
        chipSize[size],
        chipTone[tone],
        glow && chipGlow[tone],
        float && "animate-float",
        className,
      )}
      {...props}
    >
      {/* Catch-light: a soft highlight across the top turns the flat tint into a
          domed, lit surface. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/55 to-transparent dark:from-white/[0.12]"
      />
      {glow ? (
        <Icon
          className={cn("absolute opacity-50 blur-[7px]", glyphSize[size])}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      ) : null}
      <Icon
        className={cn("relative drop-shadow-sm", glyphSize[size])}
        strokeWidth={2}
        aria-hidden="true"
      />
    </span>
  );
}
