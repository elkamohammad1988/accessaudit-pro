import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  brand: "bg-gradient-to-r from-brand to-brand-2",
  success: "bg-gradient-to-r from-success to-success",
  warning: "bg-gradient-to-r from-warning to-warning",
  danger: "bg-gradient-to-r from-danger to-danger",
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
  const pct = finite ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
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
          "h-full origin-left rounded-full shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.25)] transition-all duration-700 ease-out",
          toneClass[tone],
        )}
        style={{ width: finite ? `${pct}%` : "8%" }}
      />
    </div>
  );
}
