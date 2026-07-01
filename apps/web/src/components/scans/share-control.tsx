"use client";

import { useEffect, useRef, useState } from "react";
import { setScanShare } from "@/app/(app)/scans/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/provider";

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
  const t = useTranslations("scans");
  const tc = useTranslations("common.actions");
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shareUrl = shareToken ? `${appUrl}/r/${shareToken}` : "";

  // Clear the "Copied!" reset timer if the control unmounts mid-countdown.
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context) — the input is selectable as a fallback.
    }
  }

  if (!isPublic || !shareToken) {
    return (
      <form action={setScanShare}>
        <input type="hidden" name="scanId" value={scanId} />
        <input type="hidden" name="share" value="on" />
        <Button type="submit" variant="secondary" size="sm" className="h-9">
          {t("share.createLink")}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        readOnly
        value={shareUrl}
        onFocus={(e) => e.currentTarget.select()}
        className="h-9 w-full font-mono text-xs sm:w-72"
        aria-label={t("share.linkAria")}
      />
      <Button type="button" onClick={copy} variant="secondary" size="sm" className="h-9 w-20">
        {copied ? tc("copied") : tc("copy")}
      </Button>
      <form action={setScanShare}>
        <input type="hidden" name="scanId" value={scanId} />
        <input type="hidden" name="share" value="off" />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="h-9 text-danger-strong hover:bg-danger/10"
        >
          {t("share.revoke")}
        </Button>
      </form>
    </div>
  );
}
