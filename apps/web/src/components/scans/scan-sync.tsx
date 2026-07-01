"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Effect-only sync engine for a non-terminal scan. Subscribes to Realtime updates
 * on the scan row AND polls as a fallback (Realtime requires the table to be in
 * the supabase_realtime publication; the poll guarantees progress either way).
 * Because Realtime is primary, the poll backs off (4s → 20s) and stops after a
 * hard ceiling instead of hammering a full page refetch forever.
 *
 * This is loaded lazily (see scan-live.tsx) because it pulls in the Supabase
 * Realtime client (~40 kB of WebSocket machinery) that the far more common
 * terminal-scan view never needs. Renders nothing — the visible live region lives
 * in the lightweight {@link ScanLive} boundary so screen readers hear status
 * changes without waiting on this chunk.
 */
export function ScanSync({ scanId }: { scanId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`scan-${scanId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scans", filter: `id=eq.${scanId}` },
        () => router.refresh(),
      )
      .subscribe();

    let delay = 4000;
    const MAX_DELAY = 20_000;
    const deadline = Date.now() + 15 * 60_000; // give up polling after 15 minutes
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (Date.now() > deadline) return;
      router.refresh();
      delay = Math.min(Math.round(delay * 1.5), MAX_DELAY);
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, delay);

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [scanId, router]);

  return null;
}
