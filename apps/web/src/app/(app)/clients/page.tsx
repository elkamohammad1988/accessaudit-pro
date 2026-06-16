import type { Metadata } from "next";
import Link from "next/link";
import { formatLimit, limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { restoreClientRecord } from "./actions";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const [{ data: clients }, { data: sub }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, contact_email, archived_at, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("plan").eq("organization_id", organization.id).maybeSingle(),
  ]);

  const active = (clients ?? []).filter((c) => !c.archived_at);
  const archived = (clients ?? []).filter((c) => c.archived_at);
  const plan: PlanTier = sub?.plan ?? "free";
  const limit = limitsFor(plan).clients;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {active.length} / {formatLimit(limit)} on the {limitsFor(plan).label} plan
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          New client
        </Link>
      </header>

      {active.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {active.map((client) => (
            <li key={client.id}>
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--muted))]"
              >
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {client.contact_email ?? "No contact email"}
                  </p>
                </div>
                <span aria-hidden="true" className="text-[hsl(var(--muted-foreground))]">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No clients yet</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Add the first company you audit for. Projects (their websites) live under a client.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            Add your first client
          </Link>
        </div>
      )}

      {archived.length > 0 ? (
        <details className="rounded-lg border px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">
            Archived ({archived.length})
          </summary>
          <ul className="mt-2 divide-y">
            {archived.map((client) => (
              <li key={client.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{client.name}</span>
                <form action={restoreClientRecord}>
                  <input type="hidden" name="id" value={client.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
