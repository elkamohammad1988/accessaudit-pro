import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-fg shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.2),var(--shadow-sm)] ring-1 ring-inset ring-brand-fg/15 hover:bg-brand/90 hover:shadow-brand",
  secondary:
    "border border-input bg-background shadow-xs hover:bg-muted hover:border-foreground/20 hover:shadow-sm",
  outline: "border border-input bg-transparent hover:bg-muted hover:border-foreground/20",
  ghost: "bg-transparent hover:bg-muted",
  destructive:
    "bg-danger text-danger-foreground shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.18),var(--shadow-sm)] ring-1 ring-inset ring-white/15 hover:bg-danger/90 hover:shadow-md",
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
  "transition-[background-color,box-shadow,transform,opacity,border-color] duration-150 active:scale-[0.97]",
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
