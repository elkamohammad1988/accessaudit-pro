"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface SubmitButtonProps extends ButtonProps {
  /** Label shown while the form action is pending. */
  pendingLabel?: string;
}

/**
 * Submit button wired to the parent <form>'s pending state via useFormStatus.
 * Must be rendered inside a <form>. Disables itself and swaps to pendingLabel
 * while the server action runs.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
