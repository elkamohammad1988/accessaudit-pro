"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { FavoritesProvider } from "@/components/providers/favorites-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

/**
 * The full client provider stack. Order matters only for the toast viewport (it
 * renders inside ToastProvider, so it sits above page content). Everything else is
 * independent state.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <LocaleProvider>
          <FavoritesProvider>
            <ToastProvider>{children}</ToastProvider>
          </FavoritesProvider>
        </LocaleProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
