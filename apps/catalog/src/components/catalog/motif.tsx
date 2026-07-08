import type { LucideIcon } from "lucide-react";
import { cn, hashFloat } from "@/lib/utils";

interface MotifProps {
  /** Base hue for the duotone field. */
  hue: number;
  sat?: number;
  icon?: LucideIcon;
  /** Seeds the deterministic blob placement + glyph angle. */
  seed: string;
  /** Glyph size as a fraction of the tile (0–1). */
  glyphScale?: number;
  className?: string;
}

/**
 * The shared generated-visual language: a soft duotone field with a large,
 * low-contrast glyph. ProductArt, CategoryCard and CollectionCard all render
 * through this so every generated surface belongs to one system.
 */
export function Motif({ hue, sat = 45, icon: Icon, seed, glyphScale = 0.42, className }: MotifProps) {
  const s = Math.min(72, sat + 10);
  const r1 = hashFloat(seed + "x");
  const r2 = hashFloat(seed + "y");
  const r3 = hashFloat(seed + "z");
  const angle = Math.round((hashFloat(seed + "r") - 0.5) * 22);
  const b1x = Math.round(22 + r1 * 46);
  const b1y = Math.round(16 + r2 * 34);
  const b2x = Math.round(58 + r3 * 32);
  const b2y = Math.round(58 + r1 * 30);

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-muted", className)}
      style={{
        backgroundColor: `hsl(${hue} ${Math.round(s * 0.5)}% 95%)`,
        backgroundImage: [
          `radial-gradient(115% 115% at ${b1x}% ${b1y}%, hsl(${hue} ${s}% 66% / 0.55) 0%, transparent 56%)`,
          `radial-gradient(90% 90% at ${b2x}% ${b2y}%, hsl(142 64% 58% / 0.30) 0%, transparent 60%)`,
          `linear-gradient(155deg, hsl(0 0% 100% / 0.55) 0%, transparent 46%)`,
        ].join(", "),
      }}
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-1/2 aspect-square w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50"
        style={{
          background: `radial-gradient(circle, transparent 58%, hsl(${hue} ${s}% 40% / 0.10) 59%, transparent 62%, transparent 72%, hsl(${hue} ${s}% 40% / 0.07) 73%, transparent 76%)`,
        }}
      />
      {Icon ? (
        <Icon
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: `${glyphScale * 100}%`,
            height: `${glyphScale * 100}%`,
            color: `hsl(${hue} ${s}% 34%)`,
            opacity: 0.22,
            rotate: `${angle}deg`,
          }}
          strokeWidth={1.2}
          aria-hidden
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/[0.06]" />
      <div className="pointer-events-none absolute inset-0 hidden bg-black/15 dark:block" />
    </div>
  );
}
