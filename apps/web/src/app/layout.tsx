import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { publicEnv } from "@/lib/env";
import { themeScript } from "@/lib/theme-script";

const TITLE = "AccessAudit Pro";
const DESCRIPTION =
  "On-demand WCAG 2.2 accessibility audits and white-label reports for agencies.";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: {
    default: TITLE,
    template: "%s · AccessAudit Pro",
  },
  description: DESCRIPTION,
  applicationName: TITLE,
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        {/* Set the theme class before paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
