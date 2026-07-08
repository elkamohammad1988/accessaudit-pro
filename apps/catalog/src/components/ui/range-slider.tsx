"use client";

import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
  ariaLabelMin?: string;
  ariaLabelMax?: string;
}

/** A dual-thumb range slider built from two overlaid native inputs, so it stays
 * keyboard- and touch-accessible while looking bespoke. */
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
  ariaLabelMin = "Minimum",
  ariaLabelMax = "Maximum",
}: RangeSliderProps) {
  const [lo, hi] = value;
  const span = max - min || 1;
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  return (
    <div className={cn("relative h-5 w-full", className)}>
      {/* Track */}
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
      {/* Filled span */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
        style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
      />
      {/* Min thumb — raised above the max input on the lower half so it stays grabbable */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={lo}
        aria-label={ariaLabelMin}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
        className="range-input absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2"
        style={{ zIndex: lo > max - span * 0.15 ? 5 : 3 }}
      />
      {/* Max thumb */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={hi}
        aria-label={ariaLabelMax}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
        className="range-input absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2"
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
