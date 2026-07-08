import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The AccessAudit monogram — a bespoke mark, not a letter in a box.
 *
 * The tile is a polished EMERALD → MINT gradient with a soft inner rim of light.
 * The "A" is drawn as two clean apex strokes; its crossbar is a separate pale-mint
 * bar — the "bar you must clear" — so the mark reads as accessibility *conformance*,
 * not just the initial. Colors are theme tokens, so the mark stays vivid in the
 * minted daylight and inverts correctly against the bright mint tile of the pine
 * night, and org branding flows through automatically.
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
      <defs>
        <linearGradient id="logo-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="[stop-color:hsl(var(--brand-2))]" />
          <stop offset="1" className="[stop-color:hsl(var(--brand))]" />
        </linearGradient>
      </defs>
      {/* Tile with the emerald→mint gradient and a lit inner rim. */}
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#logo-tile)" />
      {/* Top gloss catch-light — the domed highlight. */}
      <rect x="1" y="1" width="30" height="15" rx="8" className="fill-white/20" />
      <rect
        x="0.9"
        y="0.9"
        width="30.2"
        height="30.2"
        rx="8.2"
        className="fill-none stroke-white/25"
        strokeWidth="1.4"
      />
      {/* Apex strokes of the "A". */}
      <path
        d="M9.6 23.4 L16 8.6 L22.4 23.4"
        className="stroke-white dark:stroke-brand-fg"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The conformance "bar" crossbar — a pale cream rule struck across the tile
          (bright enough to clear it); on the bright terracotta night tile a
          near-black ink reads cleanly instead. */}
      <path
        d="M12.5 18 L19.5 18"
        className="stroke-[hsl(28_78%_88%)] dark:stroke-brand-fg"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
