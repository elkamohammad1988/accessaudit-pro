"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface AreaChartProps {
  /** Series values, oldest → newest. */
  data: number[];
  min?: number;
  max?: number;
  height?: number;
  className?: string;
  /** Localized accessible description of the series (required — no English fallback). */
  label: string;
  /** Faint horizontal reference lines drawn behind the curve. */
  gridlines?: number;
  /** CSS custom property (without hsl()) driving the line + fill, e.g. "--brand". */
  colorVar?: string;
  /** Show a crisp dot on the latest point (an HTML overlay, so it never stretches). */
  endDot?: boolean;
}

/**
 * Build a smooth cubic-bezier path through the points (Catmull-Rom → Bézier). The
 * gentle tension gives the flowing, hand-drawn curve of a Material dashboard chart
 * without the overshoot of a naive spline.
 */
function smoothPath(points: readonly (readonly [number, number])[]): string {
  if (points.length < 2) return "";
  const t = 0.16; // curve tension
  // Clamp a control point's Y into the band of its segment endpoints (plus a little
  // slack), so the spline never overshoots into a spike at peaks/troughs or smears
  // horizontally past the final point.
  const clampY = (y: number, a: number, b: number) => {
    const lo = Math.min(a, b) - Math.abs(a - b) * 0.5;
    const hi = Math.max(a, b) + Math.abs(a - b) * 0.5;
    return Math.max(lo, Math.min(hi, y));
  };
  const d = [`M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = clampY(p1[1] + (p2[1] - p0[1]) * t, p1[1], p2[1]);
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = clampY(p2[1] - (p3[1] - p1[1]) * t, p1[1], p2[1]);
    d.push(
      `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`,
    );
  }
  return d.join(" ");
}

/**
 * Dependency-free SVG area chart — the dashboard's headline trend widget. A smooth
 * gradient area under a self-drawing line, with faint gridlines and a live dot on
 * the latest point. Scales fluidly to its container via a non-uniform viewBox and
 * non-scaling strokes, so the curve fills any width while lines stay crisp.
 */
export function AreaChart({
  data,
  min = 0,
  max = 100,
  height = 180,
  className,
  label,
  gridlines = 4,
  colorVar = "--brand",
  endDot = true,
}: AreaChartProps) {
  const gradientId = useId();
  if (data.length < 2) return null;

  const width = 100; // viewBox units; the SVG stretches to its container width.
  const range = Math.max(1, max - min);
  const stepX = width / (data.length - 1);
  const toY = (v: number) => height - ((Math.min(max, Math.max(min, v)) - min) / range) * height;

  const points = data.map((v, i) => [i * stepX, toY(v)] as const);
  const line = smoothPath(points);
  const area = `${line} L${width},${height} L0,${height} Z`;
  const lastY = points[points.length - 1][1];
  const stroke = `hsl(var(${colorVar}))`;

  const rows = Array.from({ length: gridlines }, (_, i) => ((i + 1) / (gridlines + 1)) * height);

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.26" />
            <stop offset="70%" stopColor={stroke} stopOpacity="0.04" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {rows.map((y) => (
          <line
            key={y}
            x1="0"
            x2={width}
            y1={y}
            y2={y}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
            opacity={0.6}
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" />
        {/* The trend line draws itself in on mount: pathLength=1 normalizes the length
            so a dash of 1 with an offset animating 1 → 0 sweeps the stroke into view. */}
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={1}
          className="animate-draw-in [--draw-length:1] dark:[filter:drop-shadow(0_1px_4px_hsl(var(--brand)/0.5))]"
        />
      </svg>
      {/* Latest-point marker as an HTML overlay — a true round dot at any width
          (an SVG circle would stretch under preserveAspectRatio="none"). */}
      {endDot ? (
        <span
          aria-hidden="true"
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[hsl(var(--card))]"
          style={{ left: "100%", top: `${((lastY / height) * 100).toFixed(2)}%`, backgroundColor: stroke }}
        />
      ) : null}
    </div>
  );
}
