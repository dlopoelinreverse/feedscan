import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import { IntlProvider } from "@/i18n/IntlProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <IntlProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </IntlProvider>
      </body>
    </html>
  );
}
