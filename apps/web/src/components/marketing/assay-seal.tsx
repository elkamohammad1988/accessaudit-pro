"use client";

import { useEffect, useId, useRef } from "react";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";

/**
 * AssaySeal — the marketing hero's signature "wow" moment.
 *
 * A brass hallmark struck into the paper — a conservator's seal of assay: an
 * engraved ring of text that slowly orbits, a counter-orbiting graduated tick dial,
 * a gauge arc that draws itself to the sample score on entry, and a count-up numeral
 * at the core over the logo's "conformance bar". The whole seal leans toward the
 * cursor and drifts on scroll (parallax), so it reads as a pressed metal seal.
 *
 * Everything is GPU-cheap (transform/opacity, one shared rAF for parallax) and
 * fully `prefers-reduced-motion`-aware: no orbit, no parallax, and the count-up
 * lands instantly — the seal simply renders static and complete. It's decorative,
 * so it carries a single `role="img"` label and hides its internals from AT.
 */
export function AssaySeal({
  score = 98,
  scoreLabel,
  standard,
  ringText,
  ariaLabel,
  locale,
  className,
}: {
  score?: number;
  /** Small mono label above the numeral, e.g. "Assay score". */
  scoreLabel: string;
  /** Caption under the bar, e.g. "WCAG 2.2 AA". */
  standard: string;
  /** The engraved text that runs around the outer ring. */
  ringText: string;
  ariaLabel: string;
  locale?: string;
  className?: string;
}) {
  const pathId = useId().replace(/:/g, "");
  // The element the parallax transform is written to (nested inside the idle-float
  // wrapper so the two transforms never fight).
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = parallaxRef.current;
    if (!el) return;

    let raf = 0;
    let px = 0; // pointer offset, viewport-normalized (−0.5 … 0.5)
    let py = 0;
    let scroll = 0;

    const paint = () => {
      raf = 0;
      // Lean toward the cursor and drift slightly slower than the page scrolls.
      const tx = px * 18;
      const ty = py * 18 + scroll * -0.04;
      const rot = px * 4;
      el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      request();
    };
    const onScroll = () => {
      scroll = window.scrollY;
      request();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Ring text repeated with a separator so it wraps the full circumference.
  const engraved = `${ringText}   ·   ${ringText}   ·   `;
  // Gauge arc geometry (pathLength normalized to 100 → dash values read as %).
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative aspect-square w-full select-none", className)}
    >
      {/* Idle float wrapper — a slow, weightless bob (stilled by reduced-motion). */}
      <div className="animate-float h-full w-full">
        {/* Parallax layer — JS writes the cursor/scroll transform here. */}
        <div ref={parallaxRef} className="relative h-full w-full will-change-transform" aria-hidden="true">
          {/* A faint, still brass halo — the burnish around a pressed seal, not a
              glow. No pulse. */}
          <div className="pointer-events-none absolute inset-[10%] rounded-full bg-gold/[0.07] blur-2xl" />

          <svg viewBox="0 0 400 400" fill="none" className="relative h-full w-full">
            <defs>
              <path
                id={pathId}
                d="M 200,200 m -168,0 a 168,168 0 1,1 336,0 a 168,168 0 1,1 -336,0"
                fill="none"
              />
              <linearGradient id={`${pathId}-g`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="hsl(var(--gold-strong))" />
                <stop offset="0.5" stopColor="hsl(var(--gold-2))" />
                <stop offset="1" stopColor="hsl(var(--gold-strong))" />
              </linearGradient>
            </defs>

            {/* Double rule frame */}
            <circle cx="200" cy="200" r="192" className="stroke-gold/40" strokeWidth="1" />
            <circle cx="200" cy="200" r="150" className="stroke-gold/30" strokeWidth="1" />

            {/* Engraved orbiting text ring */}
            <g
              className="motion-safe:animate-orbit"
              style={{ transformOrigin: "center", transformBox: "fill-box" } as React.CSSProperties}
            >
              <text
                className="fill-gold-strong font-mono uppercase"
                style={{ fontSize: "12.5px", letterSpacing: "0.34em" }}
              >
                <textPath href={`#${pathId}`}>{engraved}</textPath>
              </text>
            </g>

            {/* Counter-orbiting graduated tick dial (between the two inner rules) */}
            <g
              className="motion-safe:animate-orbit-reverse"
              style={{ transformOrigin: "center", transformBox: "fill-box" } as React.CSSProperties}
            >
              {Array.from({ length: 72 }).map((_, i) => {
                const a = (i / 72) * Math.PI * 2;
                const major = i % 6 === 0;
                const r1 = major ? 128 : 134;
                const r2 = 142;
                return (
                  <line
                    key={i}
                    x1={200 + Math.cos(a) * r1}
                    y1={200 + Math.sin(a) * r1}
                    x2={200 + Math.cos(a) * r2}
                    y2={200 + Math.sin(a) * r2}
                    className={major ? "stroke-gold/70" : "stroke-gold/30"}
                    strokeWidth={major ? 1.4 : 1}
                  />
                );
              })}
            </g>

            {/* Track + gauge arc that draws to the score on entry */}
            <circle cx="200" cy="200" r="112" className="stroke-gold/12" strokeWidth="6" />
            <circle
              cx="200"
              cy="200"
              r="112"
              pathLength={100}
              stroke={`url(#${pathId}-g)`}
              strokeWidth="6"
              strokeLinecap="round"
              transform="rotate(-90 200 200)"
              className="motion-safe:animate-draw-in"
              style={
                {
                  strokeDasharray: `${clamped} 100`,
                  "--draw-length": String(clamped),
                } as React.CSSProperties
              }
            />
          </svg>

          {/* Core: the count-up score over the gold "conformance bar" (logo motif). */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              {scoreLabel}
            </span>
            <span className="mt-1 flex items-baseline font-display font-semibold leading-none">
              <CountUp
                value={clamped}
                locale={locale}
                durationMs={1600}
                className="text-gold-gradient text-6xl sm:text-7xl"
              />
              <span className="ms-1 text-xl text-muted-foreground">/100</span>
            </span>
            <span
              aria-hidden="true"
              className="mt-3 h-[3px] w-14 rounded-full bg-gradient-to-r from-gold-strong via-gold-2 to-gold-strong"
            />
            <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-gold-strong">
              {standard}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
