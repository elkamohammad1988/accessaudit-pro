"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Magnetic wrapper — the element leans toward the cursor as it approaches, then
 * springs back on leave. A premium micro-interaction reserved for the highest-
 * intent controls (primary CTAs). Pointer-only and fully disabled under
 * `prefers-reduced-motion`; keyboard/touch users get the element unchanged.
 *
 * Renders an inline-block wrapper so it composes around a Button/Link without
 * affecting layout. The transform lives on the wrapper, so the child keeps its
 * own hover/active states intact.
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  /** Fraction of the cursor offset the element follows (0–1). */
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || reduced.current) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn(
        "inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
        className,
      )}
    >
      {children}
    </span>
  );
}
