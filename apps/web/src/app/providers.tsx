"use client";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { I18nProvider } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";
import type { MessageTree } from "@/i18n/translate";

export function Providers({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: MessageTree;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider locale={locale} messages={messages}>
      <ThemeProvider>{children}</ThemeProvider>
    </I18nProvider>
  );
}
