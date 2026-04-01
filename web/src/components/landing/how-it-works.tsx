"use client";

import { useTranslations } from "next-intl";

const STEP_KEYS = ["step1", "step2", "step3"] as const;

export function HowItWorks() {
  const t = useTranslations("landing.howItWorks");

  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/30">
      <h2 className="text-3xl font-bold text-center mb-4">{t("title")}</h2>
      <p className="text-center text-muted-foreground mb-12">{t("subtitle")}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">{i + 1}</div>
            <h3 className="font-semibold">{t(`${key}.title`)}</h3>
            <p className="text-sm text-muted-foreground">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
