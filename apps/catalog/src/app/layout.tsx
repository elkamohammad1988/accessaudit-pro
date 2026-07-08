import type { Metadata, Viewport } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";
import { themeScript } from "@/lib/theme-script";

// Manrope — the precise, modern UI voice (body, controls, labels).
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Fraunces — a high-contrast, organic display serif. The seductive, hand-set voice
// that carries headlines; its botanical warmth pairs naturally with the emerald.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  style: ["normal", "italic"],
});

const TITLE = "Verdant — A curated catalogue of considered goods";
const DESCRIPTION =
  "Verdant is a premium catalogue of design objects, furniture, lighting and living things — collected with restraint and rendered with care.";

// Canonical origin for absolute URLs (OG/Twitter cards, sitemap). Prefers an
// explicit override, then Vercel's deploy URL, then a sensible localhost fallback
// so `next build` never fails for want of a configured domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3100");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fff8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1a13" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Verdant" },
  description: DESCRIPTION,
  applicationName: "Verdant",
  openGraph: {
    type: "website",
    siteName: "Verdant",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${manrope.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
