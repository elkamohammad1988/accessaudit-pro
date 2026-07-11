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

export type StatGradient = "gold" | "terracotta" | "emerald" | "rose";

// Warm, AA-safe gradients (every stop dark enough for white text ≥4.5:1). `icon`
// is the darker hue used for the glyph on the white curved panel. No cool/tech hues.
const GRADIENTS: Record<StatGradient, { bg: string; icon: string }> = {
  gold: { bg: "linear-gradient(135deg, hsl(40 60% 42%), hsl(30 64% 30%))", icon: "hsl(34 66% 34%)" },
  terracotta: { bg: "linear-gradient(135deg, hsl(16 60% 44%), hsl(8 60% 32%))", icon: "hsl(12 62% 40%)" },
  emerald: { bg: "linear-gradient(135deg, hsl(152 46% 40%), hsl(160 54% 28%))", icon: "hsl(158 52% 32%)" },
  rose: { bg: "linear-gradient(135deg, hsl(350 50% 47%), hsl(356 56% 34%))", icon: "hsl(350 54% 42%)" },
};

/**
 * Jumbo-signature metric card — a colored gradient panel with a white, curved icon
 * plate on the leading edge and a big white numeral on the trailing side. When
 * `href` is set the whole card links and lifts on hover; `beaded` adds the silver
 * stud ornament (used on the gold hero). Colored gradients read on both themes.
 */
export function GradientStatCard({
  label,
  value,
  unit,
  caption,
  icon: Icon,
  gradient,
  href,
  locale,
  beaded = false,
  className,
}: {
  label: string;
  value: number | null;
  unit?: string;
  caption?: string;
  icon: LucideIcon;
  gradient: StatGradient;
  href?: string;
  locale: string;
  beaded?: boolean;
  className?: string;
}) {
  const g = GRADIENTS[gradient];
  const body = (
    <>
      {beaded ? (
        <span
          aria-hidden="true"
          className="bead-frame pointer-events-none absolute inset-[7px] z-10 rounded-[0.7rem] border-2"
        />
      ) : null}
      {/* White curved icon plate — the Jumbo cutout. */}
      <div className="relative flex w-2/5 shrink-0 items-center justify-center rounded-e-[2.5rem] bg-white shadow-[6px_0_18px_-10px_rgba(0,0,0,0.5)]">
        <Icon className="h-7 w-7" strokeWidth={2} aria-hidden="true" style={{ color: g.icon }} />
      </div>
      <div className="relative flex flex-1 flex-col justify-center gap-1 px-4 text-white">
        <span className="flex items-end gap-1 text-[1.7rem] font-bold leading-none tabular-nums">
          {value != null ? <CountUp value={value} locale={locale} /> : "—"}
          {unit ? <span className="pb-0.5 text-sm font-semibold text-white/80">{unit}</span> : null}
        </span>
        <span className="text-[0.8rem] font-medium text-white/90">{label}</span>
        {caption ? <span className="text-[0.7rem] text-white/75">{caption}</span> : null}
      </div>
      {href ? (
        <ArrowUpRight
          className="absolute end-3 top-3 h-4 w-4 text-white/70 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
  const cls = cn(
    "group relative flex h-28 overflow-hidden rounded-2xl shadow-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    href && "hover:-translate-y-0.5 hover:shadow-lg",
    className,
  );
  if (href) {
    return (
      <Link href={href as never} className={cls} style={{ backgroundImage: g.bg }}>
        {body}
      </Link>
    );
  }
  return (
    <div className={cls} style={{ backgroundImage: g.bg }}>
      {body}
    </div>
  );
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
        "surface-gold relative flex flex-col overflow-hidden rounded-2xl p-5 shadow-lg",
        className,
      )}
    >
      {/* Beaded silver ornament — a fine studded frame inset from the gilt edge. */}
      <span
        aria-hidden="true"
        className="bead-frame pointer-events-none absolute inset-[7px] rounded-[0.7rem] border-2"
      />
      <div className="relative">
        <p className="text-sm font-semibold text-aurum-ink/80">{label}</p>
        <div className="mt-3 flex items-end gap-1.5">
          <span className="text-4xl font-bold leading-none tabular-nums tracking-tight text-aurum-ink">
            {value != null ? <CountUp value={value} locale={locale} /> : "—"}
          </span>
          {unit ? <span className="pb-1 text-sm font-medium text-aurum-ink/70">{unit}</span> : null}
        </div>
        {caption ? <p className="mt-1.5 text-xs font-medium text-aurum-ink/75">{caption}</p> : null}
      </div>
      {spark && spark.length >= 2 ? (
        <div className="relative -mx-5 -mb-5 mt-4">
          <AreaChart
            data={spark}
            label={sparkLabel}
            height={68}
            gridlines={0}
            colorVar="--aurum-ink"
            endDot={false}
            className="opacity-75"
          />
        </div>
      ) : null}
    </div>
  );
}
