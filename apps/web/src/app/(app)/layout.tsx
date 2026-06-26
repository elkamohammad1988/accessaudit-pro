import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";

// These routes read auth cookies — always rendered per-request, never prerendered.
export const dynamic = "force-dynamic";

// Defense-in-depth: robots.txt already disallows these paths, but keep the
// authed app out of any index even if a URL leaks via an external link.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Protected shell. Every /(app) route requires a session AND a workspace.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { organization, email } = await requireSession();
  if (!organization) {
    redirect("/onboarding");
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-fg"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar orgName={organization.name} email={email} />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </>
  );
}
