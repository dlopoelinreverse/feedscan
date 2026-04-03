import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const isDev = process.env.NODE_ENV === "development";

function withCookieDomain(options?: CookieOptions): CookieOptions {
  if (isDev) return options ?? {};
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain) return options ?? {};
  return {
    ...options,
    domain: `.${rootDomain}`,
    secure: true,
    sameSite: "lax",
  };
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, withCookieDomain(options))
            );
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
    }
  );
}
