import { scoreBand } from "@accessaudit/shared";

// Strong (AA) variants: the gauge value is large text and the arc is a
// graphical object, both of which the bright fills fail (≥3:1). The strong
// tokens clear it while staying clearly colored.
const TONE_CLASS = {
  success: "text-success-strong",
  warning: "text-warning-strong",
  danger: "text-danger-strong",
  muted: "text-muted-foreground",
} as const;

/**
 * Circular accessibility-score gauge. Pure SVG (no client JS) so it renders in
 * Server Components and prints cleanly in the PDF view. Colored by score band,
 * theme-aware via `currentColor`.
 */
export function ScoreGauge({
  score,
  size = 132,
  strokeWidth = 12,
}: {
  score: number | null;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = score == null ? 0 : Math.max(0, Math.min(100, score));
  const band = scoreBand(score);
  const tone = TONE_CLASS[band.tone];
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;
  // Distinct sizes need distinct gradient ids; identical defs may share one.
  const gradId = `aa-gauge-grad-${size}`;

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={tone}
        role="img"
        aria-label={score != null ? `Accessibility score ${score} out of 100` : "No score yet"}
      >
        <defs>
          {/* Subtle light→full fade across the arc for depth (premium "lit ring"). */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.7" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />

        {/* Soft colored glow behind the arc — screen only, hidden in print/PDF. */}
        {score != null ? (
          <g className="print:hidden">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${center} ${center})`}
              className="animate-draw-ring"
              style={{
                ["--circumference" as string]: circumference,
                filter: "blur(6px)",
                opacity: 0.55,
              }}
            />
          </g>
        ) : null}

        {/* Value arc — sweeps from empty → its value on mount. Pure CSS (the
         * `draw-ring` keyframe reads `--circumference` as its start offset), so
         * it works in Server Components and is disabled by reduced-motion. */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={score != null ? `url(#${gradId})` : "currentColor"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className={score != null ? "animate-draw-ring" : undefined}
          style={{ ["--circumference" as string]: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold leading-none tabular-nums ${tone}`}>
          {score != null ? score : "—"}
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}
