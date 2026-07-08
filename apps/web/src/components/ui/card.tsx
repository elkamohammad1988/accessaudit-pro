import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The shared surface treatment, exported so bespoke surfaces (e.g. the 3D
 * `TiltCard`) render pixel-identical without re-declaring the recipe.
 *
 * "Verdant Glass" card: a floating pane of frosted glass. A translucent
 * emerald-tinted gradient fill with a backdrop blur lets the luminous mesh ground
 * drift through; a hairline of white light rims the top edge (`lux-rim`) and a
 * soft, wide emerald shadow lifts it clear of the page. Large 24px corners give it
 * the modern "product-design" silhouette. The pine-dusk (`dark`) variant swaps the
 * glass tint and border for their forest values.
 */
export const cardSurfaceClass = cn(
  "lux-rim relative rounded-3xl border border-white/60 text-card-foreground",
  "bg-gradient-to-br from-white/85 via-card/65 to-white/45 backdrop-blur-xl",
  "shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.9),var(--shadow-md)]",
  "dark:border-white/10 dark:from-card/75 dark:via-card/55 dark:to-card/40",
  "dark:shadow-[inset_0_1px_0_0_hsl(150_40%_80%/0.06),var(--shadow-md)]",
);

/** Hover treatment for clickable surfaces — a real lift with a mint-warming rim
 *  and a soft emerald bloom. */
export const cardInteractiveClass = cn(
  "transition-[box-shadow,transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
  "hover:-translate-y-1 hover:border-brand-2/50",
  "hover:shadow-[var(--shadow-lg),var(--glow-brand)]",
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
      className={cn("font-display text-lg font-semibold leading-tight tracking-tight", className)}
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
