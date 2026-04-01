"use client";

import { useTranslations } from "next-intl";

const FEATURE_KEYS = ["qrCodes", "ai", "dashboard", "short", "noFriction", "humanLanguage"] as const;

export function Features() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="py-24 px-4">
      <h2 className="text-3xl font-bold text-center mb-4">{t("title")}</h2>
      <p className="text-center text-muted-foreground mb-12">{t("subtitle")}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {FEATURE_KEYS.map((key) => (
          <div key={key} className="rounded-lg border border-border p-6 space-y-2">
            <h3 className="font-semibold">{t(`${key}.title`)}</h3>
            <p className="text-sm text-muted-foreground">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
