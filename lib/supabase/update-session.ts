import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, supabaseEnv } from "@/lib/supabase/env";

function redirectKeepingCookies(url: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  const setCookies = sessionResponse.headers.getSetCookie();
  for (const cookie of setCookies) {
    redirect.headers.append("set-cookie", cookie);
  }
  return redirect;
}

/**
 * Refresh the Supabase session and gate /app.
 * Next.js 16 runs this from proxy.ts (the renamed middleware convention).
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!hasSupabaseEnv()) {
    if (path.startsWith("/app")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user && path.startsWith("/app")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return redirectKeepingCookies(redirectUrl, supabaseResponse);
  }

  if (user && path === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    return redirectKeepingCookies(redirectUrl, supabaseResponse);
  }

  return supabaseResponse;
}
