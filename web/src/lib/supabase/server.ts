import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function getCookieDomain(): string | undefined {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain || rootDomain.includes("localhost")) return undefined;
  return `.${rootDomain}`;
}

function withCookieDomain(options?: CookieOptions): CookieOptions {
  const domain = getCookieDomain();
  if (!domain) return options ?? {};
  return {
    ...options,
    domain,
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
