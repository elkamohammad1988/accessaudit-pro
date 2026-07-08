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
        // Editorial display serif (Fraunces) for marketing headlines. Latin only,
        // so the stack appends the system Arabic/CJK serifs — a non-Latin heading
        // falls through to a real script face per-glyph instead of rendering tofu.
        display: [
          "var(--font-display)",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Segoe UI Arabic",
          "Geeza Pro",
          "Noto Naskh Arabic",
          "Noto Serif SC",
          "Songti SC",
          "SimSun",
          "serif",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 5px)",
        // Oversized card radii — the "floating pane" language (24–32px).
        "4xl": "1.75rem",
        "5xl": "2.25rem",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        // Signature emerald bloom for CTAs, lit chips and hovered glass panes.
        glow: "var(--glow-brand)",
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
        // Larger, slower drift for decorative floating shapes/orbs.
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-18px) translateX(8px)" },
        },
        // Ambient gradient blobs: a slow squash-and-drift so ambient light
        // breathes behind glass. Transform-only, GPU-cheap.
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", borderRadius: "50%" },
          "33%": { transform: "translate(6%, -8%) scale(1.12)", borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%" },
          "66%": { transform: "translate(-5%, 6%) scale(0.92)", borderRadius: "60% 40% 38% 62% / 55% 58% 42% 45%" },
        },
        // Animated gradient position for gradient-text/borders that shimmer.
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
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
        // Slow drifting aurora for ambient backdrops (auth/marketing): a large
        // gold light that glides and breathes behind frosted glass. Transform +
        // opacity only, so it stays GPU-cheap.
        aurora: {
          "0%, 100%": { transform: "translate3d(-4%, -2%, 0) scale(1)", opacity: "0.55" },
          "50%": { transform: "translate3d(4%, 3%, 0) scale(1.12)", opacity: "0.85" },
        },
        // Gold specular sweep across a filled surface (primary button, gold pills):
        // a thin band of light that travels edge-to-edge on hover.
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(220%) skewX(-12deg)" },
        },
        // Page-enter: rise + un-blur into place. Paired with `template.tsx`.
        "enter-blur": {
          from: { opacity: "0", transform: "translateY(8px)", filter: "blur(6px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        // Seamless ticker for the standards marquee. Content is duplicated in the
        // markup so a -50% translate loops with no visible seam.
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // Slow orbit for the hallmark seal's outer engraved ring (marketing hero).
        orbit: {
          to: { transform: "rotate(360deg)" },
        },
        // Counter-orbit for the inner tick ring, so the seal reads as a machined
        // instrument with independently turning elements.
        "orbit-reverse": {
          to: { transform: "rotate(-360deg)" },
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
        "float-slow": "float-slow 11s ease-in-out infinite",
        blob: "blob 18s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease-in-out infinite",
        breathe: "breathe 4.5s ease-in-out infinite",
        "spin-slow": "spin-slow 9s linear infinite",
        // Slow, calm flourishes for the luxury dark surfaces.
        "glow-pulse": "glow-pulse 5.5s ease-in-out infinite",
        "draw-in": "draw-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) both",
        aurora: "aurora 16s ease-in-out infinite",
        sheen: "sheen 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
        "enter-blur": "enter-blur 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        marquee: "marquee 42s linear infinite",
        orbit: "orbit 34s linear infinite",
        "orbit-reverse": "orbit-reverse 26s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
