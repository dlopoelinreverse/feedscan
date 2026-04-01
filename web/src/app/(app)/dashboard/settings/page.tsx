import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
    </div>
  );
}
