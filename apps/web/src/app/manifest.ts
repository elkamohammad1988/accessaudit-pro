import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes the app installable (Add to Home Screen / PWA) and gives
 * the OS a name, icons, and brand colours. Icons resolve to the generated `/icon`
 * (32×32) and `/apple-icon` (180×180) routes. Colours match the dark-first
 * `--background` token (see the `themeColor` viewport export in layout.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AccessAudit Pro",
    short_name: "AccessAudit",
    description:
      "On-demand WCAG 2.2 accessibility audits and white-label reports for agencies.",
    start_url: "/",
    display: "standalone",
    background_color: "#151311",
    theme_color: "#151311",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
