import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "subtle"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-fg shadow-sm hover:bg-brand-deep hover:shadow-md",
  secondary:
    "border border-border bg-card text-foreground shadow-xs hover:border-brand/50 hover:bg-accent",
  ghost: "text-foreground hover:bg-accent",
  outline:
    "border border-brand/40 bg-transparent text-brand-deep hover:bg-brand/10 hover:border-brand",
  subtle: "bg-accent text-accent-foreground hover:bg-brand/15",
  danger: "bg-danger text-danger-foreground shadow-sm hover:brightness-95",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[0.9375rem] [--h:3.25rem] h-[var(--h)]",
  icon: "h-10 w-10",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
