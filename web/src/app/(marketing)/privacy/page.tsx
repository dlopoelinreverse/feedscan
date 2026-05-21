import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.metadata");
  return { title: t("privacyTitle") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("landing.footer");
  const tCommon = await getTranslations("common");

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">← {tCommon("back")}</Link>
      <h1 className="text-3xl font-bold mb-6">{t("privacy")}</h1>
      <p className="text-muted-foreground">{tCommon("lastUpdated", { date: new Date().getFullYear() })}</p>
    </div>
  );
}
