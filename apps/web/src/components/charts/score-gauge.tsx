import { scoreBand } from "@accessaudit/shared";

const TONE_CLASS = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          // Sweep the arc from empty → its value on mount. Pure CSS (the
          // `draw-ring` keyframe reads `--circumference` as its start offset),
          // so it works in Server Components and is disabled by reduced-motion.
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
