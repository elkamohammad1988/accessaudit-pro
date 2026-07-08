import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds an emerald-tinted lift + border on hover (for interactive cards). */
  interactive?: boolean;
}

export function Card({ interactive = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "surface overflow-hidden",
        interactive &&
          "transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-brand/30 hover:shadow-ring",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
