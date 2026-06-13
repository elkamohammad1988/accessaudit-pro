import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "AccessAudit Pro",
    template: "%s · AccessAudit Pro",
  },
  description:
    "On-demand WCAG 2.2 accessibility audits and white-label reports for agencies.",
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
