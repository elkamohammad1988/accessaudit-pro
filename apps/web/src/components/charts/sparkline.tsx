"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  /** Series values (e.g. scores 0–100), oldest → newest. */
  data: number[];
  min?: number;
  max?: number;
  height?: number;
  className?: string;
  /** Localized accessible description of the trend (required — no English fallback). */
  label: string;
}

/**
 * Dependency-free SVG sparkline: a smooth area + line with a dot on the latest
 * point. Stroke stays crisp at any width via non-scaling-stroke. Renders nothing
 * for fewer than two points (callers show an empty state instead).
 */
export function Sparkline({
  data,
  min = 0,
  max = 100,
  height = 56,
  className,
  label,
}: SparklineProps) {
  const gradientId = useId();
  if (data.length < 2) return null;

  const width = 100; // viewBox units; SVG scales to its container width.
  const range = Math.max(1, max - min);
  const stepX = width / (data.length - 1);
  const toY = (v: number) => height - ((Math.min(max, Math.max(min, v)) - min) / range) * height;

  const points = data.map((v, i) => [i * stepX, toY(v)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("h-14 w-full overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" />
      {/* The trend line draws itself in on mount: `pathLength={1}` normalizes the
          length so a dash of 1 with an offset animating 1 → 0 sweeps the stroke
          into view. Reduced-motion collapses the animation to its drawn state. */}
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--brand))"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={1}
        className="animate-draw-in [--draw-length:1] dark:[filter:drop-shadow(0_1px_3px_hsl(var(--brand)/0.55))]"
      />
      {/* Latest point — a soft breathing halo (opacity only, origin-safe in SVG)
          behind a glowing dot, reading as a live data tip. */}
      <circle
        cx={lastX}
        cy={lastY}
        r={5}
        fill="hsl(var(--brand))"
        className="animate-breathe"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={2.5}
        fill="hsl(var(--brand))"
        vectorEffect="non-scaling-stroke"
        className="dark:[filter:drop-shadow(0_0_3px_hsl(var(--brand)))]"
      />
    </svg>
  );
}
