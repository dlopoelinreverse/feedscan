"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import type { ReactNode } from "react";

const isDev = process.env.NODE_ENV !== "production";

export function IntlProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={(error) => {
        if (isDev) {
          // eslint-disable-next-line no-console
          console.error(`[i18n:client] ${error.code}: ${error.message}`);
        }
      }}
      getMessageFallback={({ namespace, key }) => {
        const path = [namespace, key].filter(Boolean).join(".");
        return isDev ? `⚠️ MISSING(${path})` : path;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
