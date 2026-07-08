import type { LucideIcon } from "lucide-react";
import { Motif } from "./motif";

interface DetailBannerProps {
  hue: number;
  icon?: LucideIcon;
  seed: string;
  kicker?: string;
  title: string;
  description?: string;
}

/** The wide art banner atop a category or collection page. */
export function DetailBanner({ hue, icon, seed, kicker, title, description }: DetailBannerProps) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-3xl border border-border shadow-sm">
      <Motif hue={hue} icon={icon} seed={seed} glyphScale={0.32} className="h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
      <div className="relative flex min-h-[13rem] flex-col justify-end p-6 sm:min-h-[16rem] sm:p-10">
        {kicker ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-4xl text-white sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
