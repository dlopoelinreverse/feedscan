import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";

function withCookieDomain(options?: CookieOptions): CookieOptions {
  if (isDev) return options ?? {};
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain) return options ?? {};
  return { ...options, domain: `.${rootDomain}`, secure: true, sameSite: "lax" };
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, withCookieDomain(options))
          );
        },
      },
    }
  );

  // Refresh session — do not remove this!
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user && error) {
    const hasAuthTokenCookie = request.cookies
      .getAll()
      .some((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name));
    if (hasAuthTokenCookie) {
      await supabase.auth.signOut();
    }
  }

  return { supabaseResponse, user };
}
