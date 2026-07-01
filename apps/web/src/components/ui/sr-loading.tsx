import { getTranslations } from "@/i18n/server";

/** Localized, visually-hidden "Loading…" announcement for skeleton states.
 *  An async Server Component so a (sync) `loading.tsx` can drop it in without
 *  itself becoming async. */
export async function SrLoading() {
  const t = await getTranslations("common.actions");
  return <span className="sr-only">{t("loading")}</span>;
}
