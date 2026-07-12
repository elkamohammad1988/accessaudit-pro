import * as React from "react";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

/**
 * Monogram — a small domed enamel disc carrying an entity's initials, coloured by
 * a warm hue derived deterministically from its name. It replaces the repeated
 * "one icon for every row" pattern on the clients/projects lists: every entity now
 * reads as its own identity, while the shared surface recipe (see `.monogram` in
 * globals.css) keeps the family cohesive. Decorative — the name always sits beside
 * it as text — so it carries no accessible name of its own.
 */

const sizeClass = {
  sm: "h-8 w-8 text-[0.7rem]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

// Eight warm, hand-picked hues — clay, rust, terracotta, amber, gold, ochre, rose
// and umber. Deliberately no cool/tech hue (indigo/blue/teal/cyan): the identity is
// warm earth. Only the hue varies between tones, so the discs stay unmistakably kin.
const HUES = [8, 18, 28, 38, 46, 350, 22, 4] as const;

/** Deterministic hue index from a name — same entity always gets the same colour. */
function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

export function Monogram({
  name,
  size = "md",
  className,
  ...props
}: {
  name: string;
  size?: keyof typeof sizeClass;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "children">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "monogram relative inline-flex shrink-0 select-none items-center justify-center rounded-xl font-semibold tracking-tight",
        sizeClass[size],
        className,
      )}
      style={{ ["--mono-h" as string]: `${hueFor(name)}` }}
      {...props}
    >
      <span className="relative">{initials(name)}</span>
    </span>
  );
}
