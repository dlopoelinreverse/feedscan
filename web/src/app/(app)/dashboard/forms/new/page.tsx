import { getTranslations } from "next-intl/server";

export default async function NewFormPage() {
  const t = await getTranslations("forms");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("createNew")}</h1>
      <p className="text-muted-foreground mt-1">{t("builder.titlePlaceholder")}</p>
    </div>
  );
}
