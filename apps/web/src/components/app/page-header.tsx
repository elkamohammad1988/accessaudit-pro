import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * The shared content header for every authed page — the Jumbo "page title block":
 * an optional breadcrumb trail, a bold title, a muted subtitle row (which can carry
 * a count badge), and a right-aligned actions slot (the primary CTA). Keeping it in
 * one primitive makes every page's header pixel-consistent and RTL-safe (logical
 * properties + a direction-neutral "/" separator).
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("space-y-2", className)}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {breadcrumb.map((crumb, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {crumb.href && !last ? (
                    <Link
                      href={crumb.href as never}
                      className="rounded transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn(last && "font-medium text-foreground")} aria-current={last ? "page" : undefined}>
                      {crumb.label}
                    </span>
                  )}
                  {!last ? <span aria-hidden="true" className="text-muted-foreground/50">/</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {/* Gilded section marker — a slim gold rule that anchors the title. */}
            <span
              aria-hidden="true"
              className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-2 to-brand"
            />
            <h1 className="text-[1.75rem] font-bold leading-none tracking-tight">{title}</h1>
          </div>
          {subtitle ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 ps-4 text-sm text-muted-foreground">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
