import { cn } from "@/lib/utils";

export interface DonutSegment {
  value: number;
  /** CSS custom property (without hsl()) for the fill, e.g. "--sev-critical". */
  colorVar: string;
  label: string;
}

/**
 * Pure-SVG donut chart — the "distribution" widget (issues by severity). Each
 * segment is a stroked arc on a shared circle, positioned by dash offset and
 * separated by a hairline gap so the ring reads as distinct wedges. Renders on the
 * server (no client JS); the center slot carries the headline total.
 *
 * Decorative by default — pass `ariaLabel` (a counted summary) so assistive tech
 * gets the same information the wedges convey by color.
 */
export function Donut({
  segments,
  size = 180,
  thickness = 20,
  className,
  ariaLabel,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  className?: string;
  ariaLabel: string;
  /** Center overlay (total + caption). */
  children?: React.ReactNode;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  // A small gap (in circumference units) between wedges so they don't blur together.
  const gap = total > 0 && segments.filter((s) => s.value > 0).length > 1 ? circumference * 0.012 : 0;

  let offset = 0;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
        className="-rotate-90"
      >
        {/* Track — always drawn so an empty distribution still reads as a ring. */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((seg) => {
            if (seg.value <= 0) return null;
            const arc = (seg.value / total) * circumference;
            const dash = Math.max(0, arc - gap);
            const el = (
              <circle
                key={seg.colorVar + seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={`hsl(var(${seg.colorVar}))`}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += arc;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
