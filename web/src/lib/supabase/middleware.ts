import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getCookieDomain(): string | undefined {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain || rootDomain.includes("localhost")) return undefined;
  return `.${rootDomain}`;
}

function withCookieDomain(options?: CookieOptions): CookieOptions {
  const domain = getCookieDomain();
  if (!domain) return options ?? {};
  return { ...options, domain, secure: true, sameSite: "lax" };
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
