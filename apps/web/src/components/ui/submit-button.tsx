"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useTranslations } from "@/i18n/provider";

export interface SubmitButtonProps extends ButtonProps {
  /** Label shown while the form action is pending. Defaults to a localized "Saving…". */
  pendingLabel?: string;
}

/**
 * Submit button wired to the parent <form>'s pending state via useFormStatus.
 * Must be rendered inside a <form>. Disables itself and swaps to pendingLabel
 * while the server action runs.
 */
export function SubmitButton({ children, pendingLabel, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const t = useTranslations("common.actions");
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (pendingLabel ?? t("saving")) : children}
    </Button>
  );
}
