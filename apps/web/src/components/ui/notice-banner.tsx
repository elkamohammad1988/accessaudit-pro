import * as React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeTone = "warning" | "error" | "success" | "info";

const TONES: Record<NoticeTone, { className: string; Icon: typeof AlertTriangle }> = {
  warning: { className: "border-warning/30 bg-warning/10 text-warning", Icon: AlertTriangle },
  error: { className: "border-danger/30 bg-danger/10 text-danger", Icon: AlertTriangle },
  success: { className: "border-success/30 bg-success/10 text-success", Icon: CheckCircle2 },
  info: { className: "border-brand/30 bg-brand/10 text-brand", Icon: Info },
};

/**
 * Page-level feedback banner for redirect-driven outcomes (e.g. a server action
 * that can only `redirect()`, not return state). Errors/warnings announce as
 * alerts; success/info as polite status updates.
 */
export function NoticeBanner({
  tone = "info",
  children,
}: {
  tone?: NoticeTone;
  children: React.ReactNode;
}) {
  const { className, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex animate-fade-in items-start gap-2 rounded-lg border px-4 py-3 text-sm",
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
