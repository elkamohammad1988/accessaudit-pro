import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The AccessAudit monogram — a bespoke mark, not a letter in a box.
 *
 * The "A" is drawn as two clean apex strokes in the brand foreground; its
 * crossbar is a separate GOLD bar — the "bar you must clear" — so the mark reads
 * as accessibility *conformance*, not just the initial. A soft inner rim gives
 * the tile a milled, lit edge. Colors are all theme tokens, so the mark inverts
 * correctly between the clay daylight brand and the copper night brand, and org
 * branding flows through automatically.
 *
 * Decorative by default (`aria-hidden`); pass a `title` to give it an accessible
 * name when it stands alone as a link target.
 */
export function LogoMark({
  className,
  title,
  ...props
}: React.SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("h-8 w-8", className)}
      {...props}
    >
      {/* Tile with the brand fill and a lit inner rim. */}
      <rect x="0" y="0" width="32" height="32" rx="9" className="fill-brand" />
      <rect
        x="0.9"
        y="0.9"
        width="30.2"
        height="30.2"
        rx="8.2"
        className="fill-none stroke-white/20"
        strokeWidth="1.4"
      />
      {/* Apex strokes of the "A". */}
      <path
        d="M9.6 23.4 L16 8.6 L22.4 23.4"
        className="stroke-brand-fg"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The conformance "bar" crossbar — gold on the light clay tile; dark ink on
          the dark-mode gold tile (where a gold-on-gold bar would vanish). */}
      <path
        d="M12.5 18 L19.5 18"
        className="stroke-gold dark:stroke-brand-fg"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
