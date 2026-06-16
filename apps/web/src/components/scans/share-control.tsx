"use client";

import { useState } from "react";
import { setScanShare } from "@/app/(app)/scans/actions";

export function ShareControl({
  scanId,
  isPublic,
  shareToken,
  appUrl,
}: {
  scanId: string;
  isPublic: boolean;
  shareToken: string | null;
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = shareToken ? `${appUrl}/r/${shareToken}` : "";

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context) — the input is selectable as a fallback.
    }
  }

  if (!isPublic || !shareToken) {
    return (
      <form action={setScanShare}>
        <input type="hidden" name="scanId" value={scanId} />
        <input type="hidden" name="share" value="on" />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
        >
          Create share link
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={shareUrl}
        onFocus={(e) => e.currentTarget.select()}
        className="h-9 w-64 rounded-md border bg-transparent px-3 text-sm"
        aria-label="Public report link"
      />
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <form action={setScanShare}>
        <input type="hidden" name="scanId" value={scanId} />
        <input type="hidden" name="share" value="off" />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium text-red-600 hover:bg-[hsl(var(--muted))]"
        >
          Revoke
        </button>
      </form>
    </div>
  );
}
