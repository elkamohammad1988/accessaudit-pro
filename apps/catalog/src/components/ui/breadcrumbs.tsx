import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-brand-deep">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-foreground" : undefined} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 rtl:rotate-180" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
