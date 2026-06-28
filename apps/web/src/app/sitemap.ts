import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/env";

/** Public, indexable routes. App routes are auth-gated and intentionally omitted. */
const PATHS = [
  "/",
  "/pricing",
  "/sample",
  "/guides",
  "/guides/european-accessibility-act",
  "/guides/wcag-2-2-aa-checklist",
  "/terms",
  "/privacy",
  "/accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appBaseUrl();
  // Build-time stamp so `lastModified` is concrete (Google uses it; it ignores
  // changeFrequency/priority). Recomputed on each deploy.
  const lastModified = new Date();
  return PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path.startsWith("/guides") ? "monthly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/guides") ? 0.7 : 0.6,
  }));
}
