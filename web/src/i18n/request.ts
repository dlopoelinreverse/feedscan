import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const isDev = process.env.NODE_ENV !== "production";

function onError(error: { code: string; message: string }) {
  if (isDev) {
    // In development, surface missing/invalid i18n keys to the console so they
    // are caught during local work rather than silently falling back.
    // eslint-disable-next-line no-console
    console.error(`[i18n] ${error.code}: ${error.message}`);
  }
}

function getMessageFallback({
  namespace,
  key,
}: {
  namespace?: string;
  key: string;
}) {
  const path = [namespace, key].filter(Boolean).join(".");
  return isDev ? `⚠️ MISSING(${path})` : path;
}

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
    onError,
    getMessageFallback,
  };
});
