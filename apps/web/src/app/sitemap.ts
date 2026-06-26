import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

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
  const base = publicEnv.appUrl.replace(/\/$/, "");
  return PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path.startsWith("/guides") ? "monthly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/guides") ? 0.7 : 0.6,
  }));
}
