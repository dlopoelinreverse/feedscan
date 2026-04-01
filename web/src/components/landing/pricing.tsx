"use client";

import { useTranslations } from "next-intl";

export function Pricing() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="py-24 px-4">
      <h2 className="text-3xl font-bold text-center mb-4">{t("title")}</h2>
      <p className="text-center text-muted-foreground mb-12">{t("subtitle")}</p>
    </section>
  );
}
