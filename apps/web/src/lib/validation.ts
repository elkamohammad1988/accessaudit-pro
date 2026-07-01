import { z } from "zod";

/** Pre-translated zod messages for {@link optionalHttpsUrl}. The caller supplies
 *  these so the validator stays locale-agnostic (it never builds English itself). */
export interface HttpsUrlMessages {
  /** Value exceeds the max length, e.g. "Avatar URL is too long." */
  tooLong: string;
  /** Value isn't a parseable URL, e.g. "Avatar URL must be a valid URL." */
  invalidUrl: string;
  /** Value doesn't start with https://, e.g. "Avatar URL must start with https://" */
  httpsUrl: string;
}

/**
 * An optional, user-supplied image URL (org logo, avatar) that is later rendered
 * in an `<img src>` — including on the public, unauthenticated share report. We
 * require `https:` explicitly so `javascript:`/`data:` and plain-`http:` values
 * can never reach the DOM (defense-in-depth alongside the CSP `img-src https:`).
 * Empty string is allowed and means "clear it".
 *
 * Messages are passed in (already localized) so this helper carries no English.
 */
export function optionalHttpsUrl(messages: HttpsUrlMessages) {
  return z
    .string()
    .trim()
    .max(2048, messages.tooLong)
    .url(messages.invalidUrl)
    .refine((value) => value.startsWith("https://"), messages.httpsUrl)
    .optional()
    .or(z.literal(""));
}
