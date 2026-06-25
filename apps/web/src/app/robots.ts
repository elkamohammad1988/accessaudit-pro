import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.appUrl.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated app surface + tokenized public reports + API: keep out of the index.
      disallow: [
        "/dashboard",
        "/clients",
        "/projects",
        "/scans",
        "/settings",
        "/onboarding",
        "/r/",
        "/api/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
