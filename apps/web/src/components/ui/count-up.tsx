"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up for dashboard statistics. Premium micro-interaction only — the
 * value never changes, just how it arrives.
 *
 * - SSR / no-JS renders the final value (correct fallback, good for crawlers).
 * - `prefers-reduced-motion` (or a zero duration) skips the animation entirely.
 * - GPU-light: a single rAF loop updating text, eased so it decelerates into place.
 * - Locale-aware formatting matches the rest of the app (`toLocaleString`).
 */
export function CountUp({
  value,
  durationMs = 1100,
  decimals = 0,
  locale,
  className,
}: {
  value: number;
  durationMs?: number;
  decimals?: number;
  locale?: string;
  className?: string;
}) {
  // Start at the final value so the server-rendered/no-JS output is correct.
  const [display, setDisplay] = useState(value);
  const frame = useRef(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || durationMs <= 0) {
      setDisplay(value);
      return;
    }

    let start = 0;
    setDisplay(0);
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic — fast, settles gently
      setDisplay(value * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, durationMs]);

  const factor = 10 ** decimals;
  const rounded = Math.round(display * factor) / factor;
  const text = locale
    ? rounded.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : rounded.toFixed(decimals);

  return <span className={className}>{text}</span>;
}
