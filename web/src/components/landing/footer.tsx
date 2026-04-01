"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-border py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t("copyright")}</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">{t("privacy")}</a>
          <a href="/terms" className="hover:text-foreground transition-colors">{t("terms")}</a>
        </div>
      </div>
    </footer>
  );
}
