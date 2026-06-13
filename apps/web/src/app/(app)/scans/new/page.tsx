import type { Metadata } from "next";
import { Placeholder } from "@/components/app/placeholder";

export const metadata: Metadata = { title: "New scan" };

export default function NewScanPage() {
  return <Placeholder title="New scan" phase="Phase 2 (scan engine)" />;
}
