import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Mail, Plus, Users } from "lucide-react";
import { formatLimit, limitsFor, type PlanTier } from "@accessaudit/shared";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            The companies you audit for
            <Badge variant="secondary">
              {active.length} / {formatLimit(limit)}
            </Badge>
          </p>
        </div>
        <ButtonLink href="/clients/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New client
        </ButtonLink>
      </header>

      {active.length > 0 ? (
        <Card className="overflow-hidden">
          <ul className="divide-y">
            {active.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/15 to-brand-2/10 text-brand ring-1 ring-inset ring-brand/15">
                      <Users className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{client.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {client.contact_email ?? "No contact email"}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add the first company you audit for. Projects (their websites) live under a client."
          action={
            <ButtonLink href="/clients/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add your first client
            </ButtonLink>
          }
        />
      )}

      {archived.length > 0 ? (
        <details className="group rounded-xl border bg-card px-4 py-3 shadow-xs transition-colors hover:border-foreground/15">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
            Archived ({archived.length})
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          <ul className="mt-2 divide-y border-t pt-1">
            {archived.map((client) => (
              <li key={client.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{client.name}</span>
                <form action={restoreClientRecord}>
                  <input type="hidden" name="id" value={client.id} />
                  <Button type="submit" variant="link" size="sm" className="h-auto p-0">
                    Restore
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
