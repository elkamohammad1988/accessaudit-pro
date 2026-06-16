/**
 * Log a database/write error server-side and return a safe, generic message for
 * the user. Avoids leaking Postgres/PostgREST internals (constraint names, schema
 * details) to the client. Wire `console.error` to your observability sink.
 */
export function genericWriteError(scope: string, error: unknown): string {
  console.error(`[${scope}]`, error);
  return "Something went wrong saving your changes. Please try again.";
}
