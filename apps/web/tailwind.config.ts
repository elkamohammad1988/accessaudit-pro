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
        brand: "var(--shadow-brand)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        "bar-grow": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "draw-ring": {
          from: { "stroke-dashoffset": "var(--circumference)" },
        },
        "draw-line": {
          from: { "stroke-dashoffset": "1" },
          to: { "stroke-dashoffset": "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "fade-up": "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.18s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        // Indeterminate bar for the live-scan "auditing…" state.
        "progress-indeterminate": "progress-indeterminate 1.4s ease-in-out infinite",
        "bar-grow": "bar-grow 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        // Circular score gauge sweeps from empty to its value on mount.
        "draw-ring": "draw-ring 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        // Sparkline line draws left→right (path normalized via pathLength="1").
        "draw-line": "draw-line 1.1s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
