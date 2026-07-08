import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/** The Verdant mark — a single leaf on an emerald tile — with an optional wordmark. */
export function LogoMark({ size = 34, withWordmark = true, className }: LogoMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="relative grid shrink-0 place-items-center rounded-xl text-white shadow-sm"
        style={{
          width: size,
          height: size,
          backgroundImage: "linear-gradient(140deg, hsl(142 71% 46%), hsl(142 72% 33%))",
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[62%] w-[62%]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Leaf body */}
          <path
            d="M12 2.5c-5.3 3-8 7.4-6.4 12.9.3 1 .8 2 1.5 2.9C9 15.7 11.4 12.7 15 10.8c-2.7 2.6-4.6 5.7-5.6 9.4 4.9 1.3 9.2-1.4 10.2-6.6C20.6 7.7 17.4 3.6 12 2.5Z"
            fill="currentColor"
          />
          {/* Stem highlight */}
          <path
            d="M9.4 20.2C10.4 15 13 11 17 8"
            stroke="hsl(142 60% 30%)"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </span>
      {withWordmark ? (
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          Verdant
        </span>
      ) : null}
    </span>
  );
}
