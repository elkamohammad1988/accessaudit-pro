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
  ariaLabel,
}: {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  /** Localized accessible label — required so the gauge never ships English. */
  ariaLabel: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = score == null ? 0 : Math.max(0, Math.min(100, score));
  const band = scoreBand(score);
  const tone = TONE_CLASS[band.tone];
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

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
        aria-label={ariaLabel}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />

        {/* Value arc — the dash offset sets how much of the ring is filled. In
            dark mode it carries a soft halo in its own band color (currentColor),
            so the ring reads as glowing metal; omitted in light/print. */}
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
          className="dark:[filter:drop-shadow(0_0_4px_currentColor)]"
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
