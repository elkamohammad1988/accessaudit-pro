/** First-letters monogram for an initials fallback (a name or email). Kept in a
 *  plain module so both client (Avatar) and server (Monogram in list pages) can use it. */
export function initials(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? cleaned[0]).concat(parts[1]?.[0] ?? "").toUpperCase();
}
