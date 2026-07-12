"use client";

import { useState } from "react";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

/**
 * Avatar — the app's one identity chip. Renders the user's image when set,
 * otherwise their initials on a brand-tinted disc with an inset ring. A broken or
 * blocked URL falls back to initials via `onError`, so it never renders empty.
 *
 * Decorative (`aria-hidden`) by design: it always sits beside the name/email as
 * text, so a redundant alt would only add noise for screen readers.
 */
export function Avatar({
  src,
  name,
  size = "sm",
  className,
}: {
  src: string | null;
  name: string;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 font-semibold text-brand ring-1 ring-inset ring-brand/15",
        sizeClass[size],
        className,
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL, off-domain; no loader/optimization wanted
        <img
          src={src}
          alt=""
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
