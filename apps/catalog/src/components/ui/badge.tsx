import { cn } from "@/lib/utils";

export type BadgeTone = "brand" | "neutral" | "success" | "warning" | "danger" | "gold";

const tones: Record<BadgeTone, string> = {
  brand: "bg-brand/12 text-brand-deep ring-1 ring-inset ring-brand/20",
  neutral: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  success: "bg-success/12 text-success ring-1 ring-inset ring-success/20",
  warning: "bg-warning/15 text-warning ring-1 ring-inset ring-warning/25",
  danger: "bg-danger/12 text-danger ring-1 ring-inset ring-danger/20",
  gold: "bg-foreground text-background",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "brand", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
