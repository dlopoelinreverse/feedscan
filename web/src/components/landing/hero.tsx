"use client";

import { useTranslations } from "next-intl";
import { getAuthUrl } from "@/lib/domains";
import { TryDemoButton } from "@/components/landing/try-demo-button";

export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="py-24 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        {t("titleLine1")} <span className="text-primary">{t("titleLine2")}</span>
      </h1>
      <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a href={getAuthUrl("/register")} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">{t("cta")}</a>
        <TryDemoButton />
      </div>
    </section>
  );
}
