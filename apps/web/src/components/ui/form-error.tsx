import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

/** Inline success banner — the positive twin of FormError, same visual rhythm. */
export function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="flex animate-fade-in items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success-strong"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/**
 * Inline form error. When `upgrade` is set — i.e. the action failed because a
 * plan limit was hit — it surfaces a one-click path to billing at the exact
 * moment of intent, instead of leaving the user to find it.
 */
export function FormError({ error, upgrade }: { error: string | null; upgrade?: boolean }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="animate-fade-in space-y-1 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger-strong"
    >
      <p>{error}</p>
      {upgrade ? (
        <Link
          href="/settings/billing"
          className="inline-block font-semibold underline underline-offset-4 hover:no-underline"
        >
          Upgrade your plan →
        </Link>
      ) : null}
    </div>
  );
}
