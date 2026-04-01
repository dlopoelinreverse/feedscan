"use client";

import { useTranslations } from "next-intl";

export function ThankYouScreen() {
  const t = useTranslations("publicForm.thankYou");

  return (
    <div className="text-center space-y-4 py-12">
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("message")}</p>
    </div>
  );
}
