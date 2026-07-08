import type { Config } from "tailwindcss";

/**
 * Verdant design system — a single source of truth for colour, type, radius,
 * shadow and motion. Every colour is CSS-variable driven (HSL channels, no
 * `hsl()` wrapper) so Tailwind can apply opacity via `hsl(var(--token) / <alpha>)`
 * and so light/dark are one toggle away. See globals.css for the token values.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        // Emerald brand ladder. `DEFAULT` (#22C55E) is the primary; `soft` (#4ADE80)
        // and `mist` (#86EFAC) are the secondary/accent tints; `deep` (#16A34A) is
        // the hover/pressed cut that clears AA as text on light surfaces.
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          soft: "hsl(var(--brand-soft) / <alpha-value>)",
          mist: "hsl(var(--brand-mist) / <alpha-value>)",
          deep: "hsl(var(--brand-deep) / <alpha-value>)",
          fg: "hsl(var(--brand-fg) / <alpha-value>)",
          tint: "hsl(var(--brand-tint) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        elevated: "hsl(var(--elevated) / <alpha-value>)",
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "hsl(var(--danger) / <alpha-value>)",
          foreground: "hsl(var(--danger-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      // One radius scale, anchored on --radius (14px). Rounded, calm, premium.
      borderRadius: {
        "2xl": "calc(var(--radius) + 8px)",
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 7px)",
      },
      // One shadow scale — soft, cool-neutral with a faint emerald undertone, layered
      // (tight contact + wide ambient) so cards lift off the mint page like real paper.
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        ring: "var(--shadow-ring)",
      },
      // One motion vocabulary. Everything is transform/opacity only (GPU-cheap) and
      // is neutralised under prefers-reduced-motion by the global rule in globals.css.
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(14px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "rise-in": "rise-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "toast-in": "toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.7s infinite",
        float: "float 7s ease-in-out infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        marquee: "marquee 38s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
