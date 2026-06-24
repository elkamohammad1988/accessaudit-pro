import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { publicEnv } from "@/lib/env";

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
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
