"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ScanStatus } from "@accessaudit/shared";
import { STATUS_META } from "@/lib/scan-format";
import { createClient } from "@/lib/supabase/client";

const TERMINAL: ReadonlySet<ScanStatus> = new Set(["completed", "partial", "failed"]);

/**
 * Keeps a non-terminal scan page in sync. Subscribes to Realtime updates on the
 * scan row AND polls as a fallback (Realtime requires the table to be in the
 * supabase_realtime publication; the poll guarantees progress either way).
 * Because Realtime is primary, the poll backs off (4s → 20s) and stops after a
 * hard ceiling instead of hammering a full page refetch forever. Renders an
 * sr-only live region so a screen-reader user hears queued → running → done.
 */
export function ScanLive({ scanId, status }: { scanId: string; status: ScanStatus }) {
  const router = useRouter();

  useEffect(() => {
    if (TERMINAL.has(status)) return;

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
  }, [scanId, status, router]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      Scan status: {STATUS_META[status].label}.
    </p>
  );
}
