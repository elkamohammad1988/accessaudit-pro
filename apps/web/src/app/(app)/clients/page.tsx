import type { Metadata } from "next";
import { Placeholder } from "@/components/app/placeholder";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return <Placeholder title="Clients" phase="Phase 1 (tenancy)" />;
}
