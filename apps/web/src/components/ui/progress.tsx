import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

interface ProgressProps {
  value: number;
  max: number;
  tone?: Tone;
  className?: string;
  label?: string;
}

/** Accessible usage meter. Caps the fill at 100% and animates the bar in. */
export function Progress({ value, max, tone = "brand", className, label }: ProgressProps) {
  const finite = Number.isFinite(max) && max > 0;
  const pct = finite ? Math.min(100, Math.round((value / max) * 100)) : 100;

  return (
    <div
      role="progressbar"
      // Unlimited tiers have no denominator, so a `value`/`max` ratio is meaningless.
      // Render an INDETERMINATE progressbar (valuemin only — omit valuenow AND
      // valuemax) rather than the malformed "valuenow with no valuemax" a fixed 8%
      // fill implied. The calm full-width tint reads as "unlimited / active"; the
      // exact usage is carried by the adjacent "N / Unlimited" label.
      aria-valuenow={finite ? value : undefined}
      aria-valuemin={0}
      aria-valuemax={finite ? max : undefined}
      aria-label={label}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-foreground/5",
        className,
      )}
    >
      <div
        className={cn(
          // `lux-sheen` adds a slow gloss wipe across the filled portion in dark
          // mode (a no-op in light mode), so the meter reads as lit, not flat.
          "lux-sheen h-full rounded-full shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.25)] transition-all duration-700 ease-out",
          toneClass[tone],
          // Dim the unlimited fill so a full bar doesn't read as "100% used / maxed".
          !finite && "opacity-40",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
