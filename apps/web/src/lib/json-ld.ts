/**
 * Serialize a value for embedding inside a `<script type="application/ld+json">`
 * block via `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` does NOT escape `<`, so a value that ever contained the literal
 * `</script>` (or `<!--`) would break out of the script element and become a
 * stored-XSS sink. Escaping `<` to its `<` unicode form closes that hole
 * without changing the parsed JSON one bit. Today every field fed to these blocks
 * is static (site title, env base URL, translated copy) — this is belt-and-braces
 * for the day any user-supplied value (org name, guide input) joins the graph.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
