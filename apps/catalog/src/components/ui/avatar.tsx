import { cn, hashInt } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Initials avatar on a deterministic emerald-family gradient seeded by the name. */
export function Avatar({ name, size = 44, className }: AvatarProps) {
  const hue = 120 + hashInt(name, 60); // 120–180: green → teal-green family
  const hue2 = hue + 26;
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-white/40 dark:ring-white/10",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 60% 42%), hsl(${hue2} 66% 34%))`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
