import { cn } from "@/lib/utils";

/**
 * AuroraField — the ambient emerald light behind marketing/auth surfaces. Layered,
 * all GPU-cheap (transform/opacity/blur only), and fully reduced-motion safe (the
 * blobs simply hold still):
 *
 *  1. Two-to-three blurred gradient BLOBS of emerald + mint that slowly drift and
 *     breathe — the living "aurora" of light.
 *  2. A field of concentric contour rings emanating from a corner — the "assay"
 *     precision motif, drawn as hairline emerald strokes and masked to dissolve at
 *     the edges, so it reads as a partial engraving.
 *  3. A couple of small floating glass shapes for depth.
 *
 * The host must be `relative` and clip overflow.
 */

const RING_RADII = [60, 120, 190, 270, 360, 460] as const;

export function AuroraField({
  className,
  anchor = "right",
}: {
  className?: string;
  /** Which top corner the contour rings emanate from. */
  anchor?: "right" | "left";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      {/* Drifting emerald + mint light — the aurora. */}
      <div className="blob blob-mint animate-blob absolute -start-[10%] -top-[22%] h-[42rem] w-[42rem] opacity-70" />
      <div className="blob animate-float-slow absolute -end-[8%] -top-[10%] h-[34rem] w-[34rem] opacity-60" />
      <div className="blob blob-mint animate-blob absolute end-[22%] top-[52%] h-[26rem] w-[26rem] opacity-40 [animation-delay:-6s]" />

      {/* Concentric contour rings — the assay motif. Anchored to a top corner and
          faded out with a radial mask so they read as a partial engraving. */}
      <svg
        className={cn(
          "absolute -top-40 h-[52rem] w-[52rem] text-brand/20 dark:text-brand-2/25",
          anchor === "right" ? "-end-40" : "-start-40",
        )}
        viewBox="0 0 920 920"
        fill="none"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
        }}
      >
        {RING_RADII.map((r) => (
          <circle
            key={r}
            cx="460"
            cy="460"
            r={r}
            stroke="currentColor"
            strokeWidth="1"
            opacity={0.9 - r / 620}
          />
        ))}
        {/* A few tick marks on the widest ring — a machined, graduated-dial feel. */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r1 = 452;
          const r2 = 468;
          return (
            <line
              key={i}
              x1={460 + Math.cos(a) * r1}
              y1={460 + Math.sin(a) * r1}
              x2={460 + Math.cos(a) * r2}
              y2={460 + Math.sin(a) * r2}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}
      </svg>

      {/* Small floating glass shapes for depth. */}
      <span className="animate-float absolute start-[14%] top-[30%] h-3 w-3 rounded-full bg-brand-2/40 blur-[1px] [animation-delay:-2s]" />
      <span className="animate-float-slow absolute end-[18%] top-[68%] h-4 w-4 rotate-45 rounded-[4px] border border-brand/30 bg-white/30 backdrop-blur-sm dark:bg-white/5" />
    </div>
  );
}
