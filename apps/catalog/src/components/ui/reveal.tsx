"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Stagger the entrance by this many milliseconds. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}

/**
 * Rises + fades its children into place when scrolled into view. Adds `is-visible`
 * once (never re-hides). Falls back to visible immediately if IntersectionObserver
 * is unavailable, and respects reduced-motion via the global CSS rule.
 */
export function Reveal({ delay = 0, as = "div", className, style, children, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ ["--reveal-delay" as string]: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}
