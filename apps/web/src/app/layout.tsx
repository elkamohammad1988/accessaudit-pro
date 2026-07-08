import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GrainOverlay } from "@/components/ui/grain";
import { appBaseUrl } from "@/lib/env";
import { themeScript } from "@/lib/theme-script";
import { directionOf, htmlLangOf } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/server";

// Self-hosted, preloaded, swap — bound to the `--font-sans` token the design
// system references. Without this the "Inter" in globals.css never loads and the
// app silently renders in a system fallback.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Fraunces — a high-contrast, "old-style" editorial serif with real character.
// The signature display face of the "Hallmark" art direction: it carries the
// marketing headlines (the seductive, hand-set voice) while Inter stays the
// precise instrument voice inside the app. Latin only; the `font-display` stack
// (tailwind.config) appends the system Arabic/CJK faces, so non-Latin headlines
// fall through to a correct script face rather than tofu. Italic ships too — the
// gold accent word in the hero is set in it.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  // Load the variable font (opsz + wght axes) rather than pinned static cuts, so
  // `font-optical-sizing: auto` can thin the strokes into true high-contrast forms
  // at hero sizes. Italic ships for the gold accent word.
  style: ["normal", "italic"],
});

const TITLE = "AccessAudit Pro";
const DESCRIPTION =
  "On-demand WCAG 2.2 accessibility audits and white-label reports for agencies.";

// Own the viewport explicitly so zoom is never disabled (WCAG 1.4.4) and the
// value is auditable rather than relying on Next's injected default.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do NOT set maximumScale/userScalable — pinch-zoom must stay enabled.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4fbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1f18" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
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

// Organization + WebSite + SoftwareApplication structured data — the cheapest
// organic-visibility lever for a content-led B2B SaaS (rich results, sitelinks,
// knowledge-panel signals). Emitted once, site-wide.
function structuredData(): string {
  const base = appBaseUrl();
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: TITLE,
        url: base,
        description: DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: TITLE,
        publisher: { "@id": `${base}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: TITLE,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: base,
        description: DESCRIPTION,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  });
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The active locale is known server-side from the cookie (set by middleware on
  // first visit, by the switcher thereafter), so `lang`/`dir` are rendered
  // correctly on the first byte — no client flip, no RTL flash.
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html
      lang={htmlLangOf(locale)}
      dir={directionOf(locale)}
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        {/* Set the theme class before paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData() }}
        />
        {/* Paper fibre, mounted once site-wide (behind all content, print-hidden):
            a fine grain that gives every surface the tooth of hand-made paper so the
            flat fills never read digital-clean. Present in both themes. */}
        <GrainOverlay />
        {/* No-JS / crawler safety net: scroll-reveal elements start hidden and are
            un-hidden by JS. Without scripting, force them visible so all content
            and copy is present. */}
        <noscript>
          <style>{".reveal{opacity:1 !important;transform:none !important}"}</style>
        </noscript>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
