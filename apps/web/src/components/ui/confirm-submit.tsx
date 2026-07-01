"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/provider";

/**
 * Inline confirmation guard for a destructive server-action submit. Renders the
 * trigger button; the first click "arms" it, revealing a compact Confirm/Cancel
 * prompt that actually submits the parent <form>. No portal or modal — it keeps
 * the action in place, accessible, and on-brand. Use for irreversible actions
 * (e.g. permanently deleting a scan) so a single misclick can't destroy data.
 */
export function ConfirmSubmit({
  children,
  confirmLabel,
  prompt,
  className,
}: {
  /** Trigger content (label + optional icon). */
  children: React.ReactNode;
  /** Label on the confirming (submit) button. */
  confirmLabel: string;
  /** Short question shown while armed. Defaults to a localized "Are you sure?". */
  prompt?: string;
  /** Classes applied to the idle trigger button. */
  className?: string;
}) {
  const t = useTranslations("common");
  const promptText = prompt ?? t("labels.areYouSure");
  const [armed, setArmed] = React.useState(false);
  const { pending } = useFormStatus();
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const wasArmed = React.useRef(false);

  // Move focus to Confirm on arm; return it to the trigger on cancel — so a
  // keyboard/AT user is never dropped at the top of the document.
  React.useEffect(() => {
    if (armed) {
      wasArmed.current = true;
      confirmRef.current?.focus();
    } else if (wasArmed.current) {
      wasArmed.current = false;
      triggerRef.current?.focus();
    }
  }, [armed]);

  if (!armed) {
    return (
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        className={className}
        onClick={() => setArmed(true)}
      >
        {children}
      </Button>
    );
  }

  return (
    <span
      role="group"
      aria-label={promptText}
      className="inline-flex items-center gap-1.5"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pending) setArmed(false);
      }}
    >
      <span className="px-1 text-xs font-medium text-muted-foreground">{promptText}</span>
      <Button ref={confirmRef} type="submit" variant="destructive" size="sm" loading={pending}>
        {confirmLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setArmed(false)}
        disabled={pending}
      >
        {t("actions.cancel")}
      </Button>
    </span>
  );
}
