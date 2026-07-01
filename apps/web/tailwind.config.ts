import type { Config } from "tailwindcss";

const config: Config = {
  // Class strategy — the theme toggle and no-flash script add/remove `.dark`.
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // CSS-variable driven so org branding can override at runtime.
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          2: "hsl(var(--brand-2) / <alpha-value>)",
          fg: "hsl(var(--brand-fg) / <alpha-value>)",
        },
        // Metallic-gold luxury accent (mainly dark mode). `strong` is the AA text
        // variant; `DEFAULT`/`2` are for borders, glows, gauges, and highlights.
        gold: {
          DEFAULT: "hsl(var(--gold) / <alpha-value>)",
          2: "hsl(var(--gold-2) / <alpha-value>)",
          strong: "hsl(var(--gold-strong) / <alpha-value>)",
          fg: "hsl(var(--gold-fg) / <alpha-value>)",
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
          strong: "hsl(var(--success-strong) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
          strong: "hsl(var(--warning-strong) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "hsl(var(--danger) / <alpha-value>)",
          foreground: "hsl(var(--danger-foreground) / <alpha-value>)",
          strong: "hsl(var(--danger-strong) / <alpha-value>)",
        },
        // Accessibility-impact severity scale (axe taxonomy). `DEFAULT` is the
        // bright fill; `strong` is the AA-contrast text variant.
        critical: {
          DEFAULT: "hsl(var(--sev-critical) / <alpha-value>)",
          strong: "hsl(var(--sev-critical-strong) / <alpha-value>)",
        },
        serious: {
          DEFAULT: "hsl(var(--sev-serious) / <alpha-value>)",
          strong: "hsl(var(--sev-serious-strong) / <alpha-value>)",
        },
        moderate: {
          DEFAULT: "hsl(var(--sev-moderate) / <alpha-value>)",
          strong: "hsl(var(--sev-moderate-strong) / <alpha-value>)",
        },
        minor: {
          DEFAULT: "hsl(var(--sev-minor) / <alpha-value>)",
          strong: "hsl(var(--sev-minor-strong) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 5px)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        // Luxury motion — all GPU-friendly (transform/opacity only). Disabled for
        // prefers-reduced-motion by the global rule in globals.css.
        "rise-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.8" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        // Breathing halo: opacity + a hair of scale, so glows bloom and recede.
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.97)" },
          "50%": { opacity: "0.85", transform: "scale(1.05)" },
        },
        // One-shot stroke reveal for charts (line draws itself in on mount).
        "draw-in": {
          from: { strokeDashoffset: "var(--draw-length)" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        // Subtle fade for content that appears in place (alerts, menus).
        "fade-in": "fade-in 0.3s ease-out both",
        // Loading affordances only: skeleton sweep + the indeterminate scan bar.
        shimmer: "shimmer 1.6s infinite",
        "progress-indeterminate": "progress-indeterminate 1.4s ease-in-out infinite",
        // Premium entrance + ambient motion.
        "rise-in": "rise-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 6s ease-in-out infinite",
        breathe: "breathe 4.5s ease-in-out infinite",
        "spin-slow": "spin-slow 9s linear infinite",
        // Slow, calm flourishes for the luxury dark surfaces.
        "glow-pulse": "glow-pulse 5.5s ease-in-out infinite",
        "draw-in": "draw-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
