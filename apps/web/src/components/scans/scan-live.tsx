"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ScanStatus } from "@accessaudit/shared";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps a non-terminal scan page in sync. Subscribes to Realtime updates on the
 * scan row AND polls as a fallback (Realtime requires the table to be in the
 * supabase_realtime publication; the poll guarantees progress either way).
 * Renders nothing.
 */
export function ScanLive({ scanId, status }: { scanId: string; status: ScanStatus }) {
  const router = useRouter();

  useEffect(() => {
    if (status === "completed" || status === "partial" || status === "failed") return;

    const supabase = createClient();
    const channel = supabase
      .channel(`scan-${scanId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scans", filter: `id=eq.${scanId}` },
        () => router.refresh(),
      )
      .subscribe();

    const interval = setInterval(() => router.refresh(), 4000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [scanId, status, router]);

  return null;
}
