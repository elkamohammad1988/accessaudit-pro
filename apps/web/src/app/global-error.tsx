"use client";

/**
 * Root error boundary. Catches errors thrown in the root layout itself, where the
 * normal (app)/error.tsx boundary can't render. It replaces the whole document,
 * so it renders its own <html>/<body> and can't rely on Tailwind or the i18n
 * provider (both live in the layout that just failed).
 *
 * To still honor the user's language here, we read the `locale` cookie directly
 * and pick from a small inline dictionary whose wording matches `errors.generic`
 * in the message catalog. Arabic also flips the document to RTL.
 */
import { useEffect, useState } from "react";

type Copy = { title: string; body: string; home: string; dir: "ltr" | "rtl" };

// Wording kept in sync with i18n/messages/<locale>/errors.json → "generic".
const STRINGS: Record<string, Copy> = {
  en: {
    title: "Something went wrong",
    body: "An unexpected error occurred. The team has been notified — please try again.",
    home: "Back to home",
    dir: "ltr",
  },
  fr: {
    title: "Une erreur est survenue",
    body: "Une erreur inattendue s'est produite. L'équipe a été avertie — veuillez réessayer.",
    home: "Retour à l'accueil",
    dir: "ltr",
  },
  es: {
    title: "Algo salió mal",
    body: "Se produjo un error inesperado. El equipo ha sido notificado; inténtalo de nuevo.",
    home: "Volver al inicio",
    dir: "ltr",
  },
  ar: {
    title: "حدث خطأ ما",
    body: "حدث خطأ غير متوقع. تم إخطار الفريق — يرجى المحاولة مرة أخرى.",
    home: "العودة إلى الصفحة الرئيسية",
    dir: "rtl",
  },
  zh: {
    title: "出现问题",
    body: "发生了意外错误。团队已收到通知——请重试。",
    home: "返回首页",
    dir: "ltr",
  },
};

function readLocale(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const value = match?.[1];
  return value && value in STRINGS ? value : "en";
}

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  // SSR renders the English default; the cookie locale is applied on hydration.
  const [locale, setLocale] = useState("en");
  useEffect(() => setLocale(readLocale()), []);

  useEffect(() => {
    // Lazily report; the SDK is code-split out when no DSN is configured.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
  }, [error]);

  const t = STRINGS[locale] ?? STRINGS.en;

  return (
    <html lang={locale} dir={t.dir}>
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
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t.title}</h1>
          <p style={{ color: "#666", marginTop: 8, fontSize: 14 }}>{t.body}</p>
          {/* Plain anchor on purpose: a hard reload resets all client state after a
              catastrophic layout failure, and next/link's router may be unusable here. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- intentional hard reload */}
          <a
            href="/"
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
            {t.home}
          </a>
        </main>
      </body>
    </html>
  );
}
