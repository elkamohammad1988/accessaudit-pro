import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  align?: "start" | "center";
  className?: string;
}

/** The consistent header used above every content section. */
export function SectionHeader({
  kicker,
  title,
  subtitle,
  href,
  linkLabel,
  align = "start",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "mx-auto max-w-2xl")}>
        {kicker ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep">
            {kicker}
          </p>
        ) : null}
        <h2 className="font-display text-3xl text-foreground sm:text-[2.5rem] sm:leading-[1.1]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-deep transition-colors hover:text-brand"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
