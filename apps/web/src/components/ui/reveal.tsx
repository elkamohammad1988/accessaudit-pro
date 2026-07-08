"use client";

import { createElement, useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal — children rise + fade into place the first time they enter the
 * viewport, then stay put. The motion lives in the `.reveal` / `.reveal.is-visible`
 * CSS (globals.css); this just toggles the class via one shared IntersectionObserver
 * pattern with a real threshold, and stagger is expressed as a `--reveal-delay`.
 *
 * Robustness:
 *  - SSR renders the children (present for crawlers); `.reveal` starts them hidden.
 *  - No IntersectionObserver / `prefers-reduced-motion` → revealed immediately.
 *  - The `<noscript>` net in the root layout forces `.reveal` visible without JS.
 *
 * `as` lets a reveal be a semantic element (e.g. a list item) rather than a div.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  /** Fraction of the element that must be visible before it reveals. */
  amount = 0.2,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: amount, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [amount]);

  // `createElement` sidesteps the ref-typing friction of `<Tag ref>` when `Tag`
  // is a polymorphic `ElementType` — the runtime behavior is identical.
  return createElement(
    Tag,
    {
      ref,
      className: cn("reveal", shown && "is-visible", className),
      style: delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined,
    },
    children,
  );
}
