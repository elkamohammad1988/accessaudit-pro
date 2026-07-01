/**
 * Server-side i18n access for Server Components, Server Actions, and route
 * handlers. Reads the locale from the request cookie (set by the middleware on
 * first visit, or by the language switcher thereafter) and returns a translator
 * bound to that locale's catalog.
 *
 * `server-only` guarantees this module never gets pulled into a client bundle.
 */
import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, asLocale, type Locale } from "./config";
import { loadMessages } from "./dictionaries";
import { createTranslator, scopeMessages, type MessageTree, type Translator } from "./translate";

/** The active locale for this request (cookie → default). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return asLocale(store.get(LOCALE_COOKIE)?.value);
}

/** The full message catalog for the active locale — passed to the client provider. */
export async function getMessages(locale?: Locale): Promise<MessageTree> {
  return loadMessages(locale ?? (await getLocale()));
}

/**
 * A translator scoped to `namespace` (e.g. `getTranslations("dashboard")` lets
 * you call `t("title")`). Omit the namespace for whole-catalog, dotted-key access.
 */
export async function getTranslations(namespace?: string): Promise<Translator> {
  const locale = await getLocale();
  const messages = await loadMessages(locale);
  return createTranslator(scopeMessages(messages, namespace), locale);
}
