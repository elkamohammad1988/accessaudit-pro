import type { Metadata } from "next";
import { Placeholder } from "@/components/app/placeholder";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <Placeholder title="Projects" phase="Phase 1 (tenancy)" />;
}
