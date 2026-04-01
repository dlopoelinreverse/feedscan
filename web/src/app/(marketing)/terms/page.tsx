import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata = { title: "Terms of Service — FeedScan" };

export default async function TermsPage() {
  const t = await getTranslations("landing.footer");
  const tCommon = await getTranslations("common");

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">← {tCommon("back")}</Link>
      <h1 className="text-3xl font-bold mb-6">{t("terms")}</h1>
      <p className="text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
    </div>
  );
}
