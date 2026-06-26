"use client";

/**
 * Root error boundary. Catches errors thrown in the root layout itself, where
 * the normal (app)/error.tsx boundary can't render. Replaces the whole document,
 * so it must render its own <html>/<body> and can't rely on Tailwind being loaded.
 */
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Lazily report; the SDK is code-split out when no DSN is configured.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#111",
        }}
      >
        {/* Tailwind/tokens may not be loaded here, so honor the OS theme with a
            self-contained media query (!important to beat the inline styles). */}
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background: #070b14 !important; color: #f5f7fa !important; }
            body p { color: #9aa3b2 !important; }
            body a { color: #f5f7fa !important; border-color: #2a2f3a !important; }
          }
        `}</style>
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#666", marginTop: 8, fontSize: 14 }}>
            An unexpected error occurred. Please reload the page, or head back to your dashboard.
          </p>
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ddd",
              textDecoration: "none",
              color: "#111",
              fontSize: 14,
            }}
          >
            Go to dashboard
          </a>
        </main>
      </body>
    </html>
  );
}
