import Link from "next/link";

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
      className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      <p>{error}</p>
      {upgrade ? (
        <Link
          href="/settings/billing"
          className="inline-block font-medium text-red-800 underline underline-offset-4 hover:no-underline"
        >
          Upgrade your plan →
        </Link>
      ) : null}
    </div>
  );
}
