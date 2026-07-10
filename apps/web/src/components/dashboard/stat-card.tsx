import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cardInteractiveClass, cardSurfaceClass } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { CountUp } from "@/components/ui/count-up";
import { AreaChart } from "@/components/charts/area-chart";
import { cn } from "@/lib/utils";

type Tone = "brand" | "gold" | "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: number;
  /** Small line under the value, e.g. "of 50" or a delta. */
  caption?: string;
  icon: LucideIcon;
  tone?: Tone;
  href?: string;
  locale: string;
  /** Optional trailing unit rendered muted after the value (e.g. "/ 100"). */
  unit?: string;
  className?: string;
}

/**
 * Jumbo-style KPI tile — a clean Material panel with a colored enamel icon, a large
 * counted value, and a caption. When `href` is set the whole tile becomes a link
 * that lifts on hover and reveals a corner arrow, the "drill in" affordance.
 */
export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "brand",
  href,
  locale,
  unit,
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <IconChip icon={Icon} tone={tone} size="sm" />
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-3xl font-bold leading-none tabular-nums tracking-tight">
          <CountUp value={value} locale={locale} />
        </span>
        {unit ? <span className="pb-0.5 text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </div>
      {caption ? <p className="mt-1.5 text-xs text-muted-foreground">{caption}</p> : null}
      {href ? (
        <ArrowUpRight
          className="absolute end-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href as never}
        className={cn(cardSurfaceClass, cardInteractiveClass, "group block p-5", className)}
      >
        {body}
      </Link>
    );
  }
  return <div className={cn(cardSurfaceClass, "p-5", className)}>{body}</div>;
}

/**
 * Jumbo "contrast" card — a filled clay panel with white ink and a full-bleed area
 * chart hugging the bottom edge. The dashboard's single loud, colored statistic.
 */
export function FilledStatCard({
  label,
  value,
  unit,
  caption,
  spark,
  sparkLabel,
  locale,
  className,
}: {
  label: string;
  value: number | null;
  unit?: string;
  caption?: string;
  spark?: number[];
  sparkLabel: string;
  locale: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "lux-rim relative flex flex-col overflow-hidden rounded-2xl p-5 text-brand-fg shadow-md",
        "bg-gradient-to-br from-brand-2 via-brand to-brand",
        className,
      )}
    >
      {/* Soft top-light so the fill reads as a domed, lit surface rather than flat paint. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
      />
      <div className="relative">
        <p className="text-sm font-medium text-brand-fg/85">{label}</p>
        <div className="mt-3 flex items-end gap-1.5">
          <span className="text-4xl font-bold leading-none tabular-nums tracking-tight">
            {value != null ? <CountUp value={value} locale={locale} /> : "—"}
          </span>
          {unit ? <span className="pb-1 text-sm font-medium text-brand-fg/80">{unit}</span> : null}
        </div>
        {caption ? <p className="mt-1.5 text-xs text-brand-fg/80">{caption}</p> : null}
      </div>
      {spark && spark.length >= 2 ? (
        <div className="relative -mx-5 -mb-5 mt-4">
          <AreaChart
            data={spark}
            label={sparkLabel}
            height={68}
            gridlines={0}
            colorVar="--brand-fg"
            endDot={false}
            className="opacity-90"
          />
        </div>
      ) : null}
    </div>
  );
}
