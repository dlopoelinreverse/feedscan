import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  // 1. Check NEXT_LOCALE cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  // 2. Fall back to Accept-Language header detection
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") || "";
  const browserLocale = acceptLanguage.includes("fr") ? "fr" : "en";

  const locale = cookieLocale === "fr" || cookieLocale === "en" ? cookieLocale : browserLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
