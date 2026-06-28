import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";
import { createClientRecord } from "../actions";

export const metadata: Metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Clients
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">New client</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a company you audit for. Projects (their websites) live under a client.
        </p>
      </div>
      <ClientForm action={createClientRecord} submitLabel="Create client" />
    </div>
  );
}
