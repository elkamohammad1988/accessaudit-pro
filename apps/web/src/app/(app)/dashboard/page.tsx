import type { Metadata } from "next";
import Link from "next/link";
import { limitsFor, formatLimit, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export default async function DashboardPage() {
  const { organization } = await requireSession();
  // Layout guarantees an organization, but TS doesn't know that.
  if (!organization) return null;

  const supabase = await createClient();

  const [{ data: subscription }, { count: scansThisMonth }, { data: recentScans }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .gte("created_at", startOfMonthIso()),
      supabase
        .from("scans")
        .select("id, status, score, created_at, pages_scanned")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const plan: PlanTier = subscription?.plan ?? "free";
  const limits = limitsFor(plan);
  const used = scansThisMonth ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {organization.name} · {limits.label} plan
          </p>
        </div>
        <Link
          href="/scans/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          New scan
        </Link>
      </header>

      <section
        aria-label="Usage this month"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="rounded-lg border p-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Scans this month</p>
          <p className="mt-1 text-2xl font-semibold">
            {used}
            <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">
              {" "}
              / {formatLimit(limits.scansPerMonth)}
            </span>
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Clients</p>
          <p className="mt-1 text-2xl font-semibold">
            <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">
              up to {formatLimit(limits.clients)}
            </span>
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Pages / scan</p>
          <p className="mt-1 text-2xl font-semibold">{formatLimit(limits.pagesPerScan)}</p>
        </div>
      </section>

      <section aria-label="Recent scans" className="space-y-3">
        <h2 className="text-lg font-medium">Recent scans</h2>
        {recentScans && recentScans.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {recentScans.map((scan) => (
              <li key={scan.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{scan.status}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(scan.created_at).toLocaleString()} · {scan.pages_scanned} page(s)
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {scan.score != null ? `${scan.score}/100` : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">No scans yet</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Run your first accessibility audit to see results here.
            </p>
            <Link
              href="/scans/new"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              Run your first scan
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
