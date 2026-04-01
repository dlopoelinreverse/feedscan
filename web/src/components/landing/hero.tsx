"use client";

import { useTranslations } from "next-intl";
import { getAuthUrl } from "@/lib/domains";

export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="py-24 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        {t("titleLine1")} <span className="text-primary">{t("titleLine2")}</span>
      </h1>
      <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
      <div className="mt-10 flex gap-4 justify-center">
        <a href={getAuthUrl("/register")} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">{t("cta")}</a>
        <a href="#how-it-works" className="border border-border px-8 py-3 rounded-lg font-medium hover:bg-muted transition-colors">{t("demo")}</a>
      </div>
    </section>
  );
}
