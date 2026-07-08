import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

/** A calm, centred empty/zero-result state with an icon medallion. */
export function EmptyState({ icon: Icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand-deep ring-1 ring-inset ring-brand/15">
        <Icon className="h-7 w-7" aria-hidden strokeWidth={1.6} />
      </span>
      <h3 className="mt-5 font-display text-xl text-foreground">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
