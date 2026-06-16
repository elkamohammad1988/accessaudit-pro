import type { Metadata } from "next";
import Link from "next/link";
import { ClientForm } from "@/components/clients/client-form";
import { createClientRecord } from "../actions";

export const metadata: Metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/clients"
          className="text-sm text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
        >
          ← Clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New client</h1>
      </div>
      <ClientForm action={createClientRecord} submitLabel="Create client" />
    </div>
  );
}
