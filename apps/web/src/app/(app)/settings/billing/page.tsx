import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/app/placeholder";

export const metadata: Metadata = { title: "Billing" };

// Filled in by Phase 4 (Stripe). Route exists now so navigation/typed-routes work.
export default function BillingPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/settings"
        className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
      >
        ← Settings
      </Link>
      <Placeholder title="Billing" phase="Phase 4 (Stripe)" />
    </div>
  );
}
