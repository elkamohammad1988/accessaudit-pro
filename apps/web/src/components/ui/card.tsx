import * as React from "react";
import { cn } from "@/lib/utils";

/** Surface primitive. `interactive` adds hover lift for clickable cards. */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground",
        // Light "Warm Atelier" card: a crisp lit hairline along the top edge plus
        // the soft ambient shadow, so the near-white card reads as a real surface
        // lifted off the ivory page — depth from light, not a flat drop-blur.
        "shadow-[inset_0_1px_0_0_hsl(40_60%_100%/0.7),var(--shadow-sm)]",
        // Luxury dark theme: a frosted-glass surface — translucent obsidian, soft
        // backdrop blur, a faint gold inset rim, and deeper layered shadow. The
        // `lux-rim` adds a hairline gold catch-light along the top edge, and a
        // top-down gloss gradient lifts the flat fill into lit material. All scoped
        // to `dark:` so light mode keeps its warm ceramic card.
        "lux-rim dark:border-white/[0.06] dark:bg-card/70 dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/0 dark:shadow-md dark:backdrop-blur-xl dark:ring-1 dark:ring-inset dark:ring-gold/[0.08]",
        interactive &&
          "transition-[box-shadow,transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-lg dark:hover:border-gold/30 dark:hover:shadow-lg dark:hover:ring-gold/20",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-5 pt-0", className)} {...props} />;
}
