import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

/** Routes reachable without a session. Everything else requires auth.
 *  `/api` routes authenticate themselves (e.g. the Stripe webhook verifies its
 *  signature) and must not be redirected to /login. */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/reset",
  "/auth",
  "/r",
  "/api",
  "/terms",
  "/privacy",
  "/pricing",
  "/sample",
  "/guides",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  // Exact match or a real path-segment boundary only — `/reset` must not make
  // `/reset-internal` public (a bare startsWith would). `(app)/layout.tsx` also
  // re-checks the session server-side, so this is defense in depth.
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase auth cookie on every request and enforces routing:
 * signed-out users are sent to /login; signed-in users on an auth page are sent
 * to /dashboard. Based on the @supabase/ssr Next.js middleware recipe.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  // If env is not configured yet, do nothing (lets the app boot to show setup errors).
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with the auth server. Do not put
  // any logic between createServerClient and getUser, or you risk random logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const onAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/reset");

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (onAuthPage || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
