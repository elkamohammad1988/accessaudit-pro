import { z } from "zod";

/**
 * An optional, user-supplied image URL (org logo, avatar) that is later rendered
 * in an `<img src>` — including on the public, unauthenticated share report. We
 * require `https:` explicitly so `javascript:`/`data:` and plain-`http:` values
 * can never reach the DOM (defense-in-depth alongside the CSP `img-src https:`).
 * Empty string is allowed and means "clear it".
 */
export function optionalHttpsUrl(label: string) {
  return z
    .string()
    .trim()
    .max(2048, `${label} is too long.`)
    .url(`${label} must be a valid URL.`)
    .refine((value) => value.startsWith("https://"), `${label} must start with https://`)
    .optional()
    .or(z.literal(""));
}
