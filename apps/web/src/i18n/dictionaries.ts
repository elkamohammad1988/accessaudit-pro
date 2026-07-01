/**
 * Per-locale message loaders. Each locale's catalog is code-split behind a
 * dynamic import, so a given request only ships the active language's strings —
 * the other four never reach the bundle. The static map (rather than a computed
 * `import(\`./messages/${locale}\`)`) keeps the set analyzable by the bundler.
 */
import type { Locale } from "./config";
import type { MessageTree } from "./translate";

const loaders: Record<Locale, () => Promise<{ default: MessageTree }>> = {
  en: () => import("./messages/en"),
  fr: () => import("./messages/fr"),
  ar: () => import("./messages/ar"),
  es: () => import("./messages/es"),
  zh: () => import("./messages/zh"),
};

export async function loadMessages(locale: Locale): Promise<MessageTree> {
  return (await loaders[locale]()).default;
}
