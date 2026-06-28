import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = appBaseUrl();
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
        "/login",
        "/signup",
        "/reset",
        "/update-password",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
