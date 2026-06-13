import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";

// These routes read auth cookies — always rendered per-request, never prerendered.
export const dynamic = "force-dynamic";

// Protected shell. Every /(app) route requires a session AND a workspace.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { organization, email } = await requireSession();
  if (!organization) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar orgName={organization.name} email={email} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
