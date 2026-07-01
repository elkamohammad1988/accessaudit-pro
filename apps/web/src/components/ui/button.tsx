import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
type Size = "sm" | "md" | "lg" | "icon";

// Light mode stays quiet (a tone shift + flat shadow). Dark mode gives the filled
// primary a lit, metallic-gold treatment: a top-down gradient, a catch-light on
// the top edge, and a soft gold glow that blooms on hover — the "expensive" cue,
// kept subtle (no flashy effects). The press (active:scale) carries the tactile.
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-fg shadow-sm hover:bg-brand/90 dark:bg-gradient-to-b dark:from-brand-2 dark:to-brand dark:shadow-[inset_0_1px_0_0_hsl(46_90%_82%/0.30),var(--shadow-sm)] dark:hover:shadow-[inset_0_1px_0_0_hsl(46_90%_82%/0.30),0_0_22px_-4px_hsl(var(--brand)/0.6)]",
  secondary: "border border-input bg-background shadow-xs hover:bg-muted",
  outline: "border border-input bg-transparent hover:bg-muted",
  ghost: "bg-transparent hover:bg-muted",
  destructive: "bg-danger text-danger-foreground shadow-sm hover:bg-danger/90",
  link: "bg-transparent text-brand underline-offset-4 hover:underline",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-[15px]",
  icon: "h-9 w-9",
};

const baseClasses = cn(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
  "transition-[background-color,background-image,box-shadow,transform,opacity,border-color] duration-200 active:scale-[0.97]",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  "disabled:pointer-events-none disabled:opacity-50",
);

/** Shared button class string, so links-styled-as-buttons stay pixel-identical. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Show a spinner and disable the button while a client-side action runs. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", loading, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export type ButtonLinkProps<RouteInferType> = LinkProps<RouteInferType> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
};

/**
 * A Next.js <Link> rendered with the Button's exact styling. Generic over the
 * route type so it keeps `typedRoutes` validation (including dynamic segments).
 * Use for navigation that should look like a button (CTAs, "New …" actions) so we
 * never re-declare the brand-button classes inline again.
 */
export function ButtonLink<RouteInferType>({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps<RouteInferType>) {
  return (
    <Link className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
