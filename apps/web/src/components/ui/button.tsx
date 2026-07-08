import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
type Size = "sm" | "md" | "lg" | "icon";

// The primary is a glossy EMERALD pill: a solid brand fill (token-driven so it stays
// AA and inverts to bright mint-on-dark automatically) lit by an inner top catch-light
// so it reads as a soft-gradient dome, and — on hover — a colored EMERALD bloom (the
// signature glow) plus a thin band of light that sweeps edge-to-edge (`btn-sheen`).
// The base `active:scale` carries the tactile press. Secondary/outline are frosted
// glass; destructive blooms madder on hover.
const variantClasses: Record<Variant, string> = {
  primary:
    "btn-sheen bg-brand text-brand-fg shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.32),inset_0_-2px_5px_0_hsl(20_55%_14%/0.35),var(--shadow-sm)] hover:shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.4),var(--glow-brand)]",
  secondary:
    "border border-border bg-card/70 backdrop-blur-md text-foreground shadow-xs hover:-translate-y-px hover:border-brand-2/50 hover:bg-card hover:shadow-sm",
  outline:
    "border border-input bg-transparent hover:border-brand-2/50 hover:bg-accent/60",
  ghost: "bg-transparent hover:bg-accent/70",
  destructive:
    "bg-danger text-danger-foreground shadow-sm hover:shadow-[var(--shadow-sm),0_8px_26px_-6px_hsl(var(--danger)/0.55)]",
  link: "bg-transparent text-brand underline-offset-4 hover:underline",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
  icon: "h-10 w-10",
};

const baseClasses = cn(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium",
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
