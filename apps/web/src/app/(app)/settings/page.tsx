import type { Metadata } from "next";
import { Placeholder } from "@/components/app/placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <Placeholder title="Settings" phase="Phase 1 (profile, org, branding)" />;
}
