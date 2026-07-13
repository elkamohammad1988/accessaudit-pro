import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Monogram } from "@/components/ui/monogram";
import { scoreClassName } from "@/lib/scan-format";
import { cn } from "@/lib/utils";

/**
 * EntityRow — the one premium list row shared by the clients, projects and
 * client-detail lists. A warm per-entity Monogram on the leading edge, a title and
 * a muted subtitle, an optional cluster of trailing stats, and a corner arrow that
 * nudges out on hover. Replaces three near-identical hand-rolled rows (each with the
 * same repeated icon and no data) with one dense, distinct, RTL-safe component.
 */
export function EntityRow({
  href,
  title,
  subtitle,
  subtitleIcon: SubtitleIcon,
  monogramName,
  stats,
  score,
  scoreLabel,
}: {
  href: string;
  title: string;
  /** Secondary line (email, or "client · url"). */
  subtitle?: React.ReactNode;
  subtitleIcon?: LucideIcon;
  /** Seeds the monogram's initials + colour (usually the title). */
  monogramName: string;
  /** Secondary metric pills (counts); hidden below `sm` so the row never overflows. */
  stats?: React.ReactNode;
  /** Latest score. Rendered as a pill kept visible even on mobile — it's the primary
   *  signal a list scanner wants, so unlike `stats` it does not collapse below `sm`.
   *  Pass `undefined` to omit entirely; `null` renders the muted "no score" dash. */
  score?: number | null;
  scoreLabel?: string;
}) {
  return (
    <li>
      <Link
        href={href as never}
        className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-5"
      >
        <Monogram name={monogramName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              {SubtitleIcon ? <SubtitleIcon className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
              <span className="truncate">{subtitle}</span>
            </p>
          ) : null}
        </div>
        {stats ? <div className="hidden shrink-0 items-center gap-1.5 sm:flex">{stats}</div> : null}
        {score !== undefined ? <ScorePill score={score} label={scoreLabel ?? ""} /> : null}
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/** A compact trailing metric — a lucide glyph and a number in a muted well. */
export function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  /** Full accessible text, e.g. "3 projects". */
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-inset ring-border/60"
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {value}
    </span>
  );
}

/** A latest-score chip, coloured by band; a muted dash when there's no score. */
function ScorePill({ score, label }: { score: number | null; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[2.75rem] items-center justify-center rounded-full bg-muted/70 px-2 py-1 text-xs font-bold tabular-nums ring-1 ring-inset ring-border/60",
        score != null ? scoreClassName(score) : "text-muted-foreground/70",
      )}
      aria-label={label}
    >
      {score != null ? score : "—"}
    </span>
  );
}
