import { createBrowserClient } from "@supabase/ssr";

function getCookieDomain(): string | undefined {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain || rootDomain.includes("localhost")) return undefined;
  // Leading dot allows cookie to be shared across all subdomains
  return `.${rootDomain}`;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: getCookieDomain(),
        secure: !process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes("localhost"),
        sameSite: "lax",
      },
    }
  );
}
