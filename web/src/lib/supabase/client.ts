import { createBrowserClient } from "@supabase/ssr";

const isDev = process.env.NODE_ENV === "development";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    isDev
      ? {}
      : {
          cookieOptions: {
            domain: `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`,
            secure: true,
            sameSite: "lax" as const,
          },
        }
  );
}
