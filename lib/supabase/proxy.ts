import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getSupabaseEnv,
  hasSupabaseEnv,
  MISSING_SUPABASE_ENV_MESSAGE,
} from "@/lib/supabase/env";

/** Route prefixes that require an authenticated session. */
const PROTECTED_PREFIXES = ["/app"];

/** Routes an authenticated user should be moved away from. */
const GUEST_ONLY_PREFIXES = ["/login"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (next) {
    url.searchParams.set("next", next);
  }
  return NextResponse.redirect(url);
}

/**
 * Refreshes the Supabase session on every request and enforces route access.
 *
 * Called from the root `proxy.ts`. Keep the code between `createServerClient`
 * and the session read free of additional logic — the cookie handshake must
 * stay intact or users will be randomly signed out.
 */
export async function updateSession(request: NextRequest) {
  // Nothing can be authenticated without a Supabase project, so instead of
  // crashing every request we keep /login reachable and send visitors away
  // from the protected area.
  if (!hasSupabaseEnv()) {
    console.warn(`[myspace] ${MISSING_SUPABASE_ENV_MESSAGE}`);

    if (matchesPrefix(request.nextUrl.pathname, PROTECTED_PREFIXES)) {
      return redirectTo(request, "/login", request.nextUrl.pathname);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  let userId: string | null = null;

  try {
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims?.sub ?? null;
  } catch (error) {
    // Fails closed: an unverifiable session is treated as signed out.
    console.warn("[myspace] Could not verify the Supabase session.", error);
  }

  const { pathname } = request.nextUrl;

  if (!userId && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const destination = redirectTo(request, "/login", pathname);
    for (const cookie of response.cookies.getAll()) {
      destination.cookies.set(cookie);
    }
    return destination;
  }

  if (userId && matchesPrefix(pathname, GUEST_ONLY_PREFIXES)) {
    const destination = redirectTo(request, "/app");
    for (const cookie of response.cookies.getAll()) {
      destination.cookies.set(cookie);
    }
    return destination;
  }

  return response;
}
