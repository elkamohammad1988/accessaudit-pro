import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // CSS-variable driven so org branding can override at runtime later.
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          fg: "hsl(var(--brand-fg) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
