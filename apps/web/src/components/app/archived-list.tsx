import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cardSurfaceClass } from "@/components/ui/card";
import { getTranslations } from "@/i18n/server";
import { cn } from "@/lib/utils";

/**
 * The collapsible "N archived" panel with a per-row restore button, shared by the
 * clients and projects lists (previously two byte-identical `<details>` blocks).
 * Renders nothing when empty. A server component: it reads its own labels and takes
 * the record type's `restore` server action, which each row submits with its id.
 */
export async function ArchivedList({
  items,
  restoreAction,
}: {
  items: readonly { id: string; name: string }[];
  restoreAction: (formData: FormData) => void | Promise<void>;
}) {
  if (items.length === 0) return null;
  const tc = await getTranslations("common");

  return (
    <details
      className={cn(
        cardSurfaceClass,
        "group px-4 py-3 transition-colors hover:border-foreground/15 dark:hover:border-gold/25",
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
        {tc("labels.archivedCount", { count: items.length })}
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <ul className="mt-2 divide-y border-t pt-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{item.name}</span>
            <form action={restoreAction}>
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" variant="ghost" size="sm">
                {tc("actions.restore")}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </details>
  );
}
