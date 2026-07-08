"use client";

import { useEffect, useRef } from "react";
import { cardSurfaceClass } from "./card";
import { cn } from "@/lib/utils";

/**
 * A paper card that tips ever so slightly toward the cursor — the "held sheet"
 * treatment, reserved for hero surfaces (the dashboard score card, headline stats).
 * Renders the exact same letterpress paper surface as `<Card>` (shared
 * `cardSurfaceClass`), so it stays visually identical, just subtly alive. No sheen,
 * no gold ring (the specular `tilt-sheen` is retired to a no-op in globals.css).
 *
 * Pointer-only. Under `prefers-reduced-motion` the tip is suppressed and the card
 * behaves as a plain static sheet. The tip is decorative; interactive content
 * inside keeps its own semantics and focus behavior.
 */
export function TiltCard({
  children,
  className,
  /** Maximum rotation in degrees at the card's edges — a gentle "held sheet" tip. */
  max = 3,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reduced.current) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0 → 1 across
    const py = (e.clientY - r.top) / r.height; // 0 → 1 down
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;
    el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(1000px)";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn(
        cardSurfaceClass,
        "relative transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
        className,
      )}
    >
      {children}
    </div>
  );
}
