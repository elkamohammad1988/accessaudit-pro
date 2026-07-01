import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "@/i18n/server";

/** Form-shaped skeleton matching the new-scan page that follows. */
export default async function Loading() {
  const t = await getTranslations("common.actions");
  return (
    <div className="mx-auto max-w-lg space-y-5" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4 rounded-lg border p-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
