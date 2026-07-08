"use client";

import { SearchProvider } from "./search-overlay";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { MobileBottomNav } from "./mobile-bottom-nav";

/**
 * The persistent app frame: sticky header, page content, footer, and the touch
 * bottom-nav — all inside the SearchProvider so the ⌘K overlay is reachable
 * everywhere. Content gets bottom padding on mobile to clear the bottom nav.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <Footer />
      </div>
      <MobileBottomNav />
    </SearchProvider>
  );
}
