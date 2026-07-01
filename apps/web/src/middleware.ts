import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { detectLocale } from "@/i18n/detect";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/i18n/config";

export async function middleware(request: NextRequest) {
  // First visit (no locale cookie): negotiate from Accept-Language and persist it.
  // Setting it on the *request* makes it visible to this render's `cookies()` (so
  // SSR picks the right language immediately); setting it on the *response* stores
  // it in the browser for subsequent visits. The switcher overrides it later.
  const hasLocale = request.cookies.has(LOCALE_COOKIE);
  const detected = hasLocale ? null : detectLocale(request.headers.get("accept-language"));
  if (detected) {
    request.cookies.set(LOCALE_COOKIE, detected);
  }

  const response = await updateSession(request);

  if (detected) {
    response.cookies.set(LOCALE_COOKIE, detected, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  // Per-request correlation id, surfaced on the response so a support report or a
  // platform/Sentry log line can be tied back to a single request. Generated fresh
  // (not echoed from the client) so a crafted header can't inject into logs.
  response.headers.set("x-request-id", crypto.randomUUID());

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
