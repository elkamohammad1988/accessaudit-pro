import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The shared surface treatment, exported so bespoke surfaces (e.g. the 3D
 * `TiltCard`) render pixel-identical without re-declaring the recipe.
 *
 * Clean "Material admin" card (Jumbo-inspired): a solid, near-opaque surface that
 * sits a half-step above the page, lifted by one soft, wide shadow and bounded by
 * a hairline clay border. Medium 16px corners give it the modern dashboard
 * silhouette. No glass blur, no gradient wash — the calm, legible panel a
 * data-dense admin UI is built from. The dark variant is the raised warm-slate pane.
 */
export const cardSurfaceClass = cn(
  "relative rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm",
  "dark:border-border/60",
);

/** Hover treatment for clickable surfaces — a gentle Material lift with a soft
 *  clay-tinted border, the "this row is interactive" cue. */
export const cardInteractiveClass = cn(
  "transition-[box-shadow,transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
  "hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md",
);

/** Surface primitive. `interactive` adds hover lift for clickable cards. */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(cardSurfaceClass, interactive && cardInteractiveClass, className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
