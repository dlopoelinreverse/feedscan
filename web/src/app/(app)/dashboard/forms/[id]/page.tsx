import { getTranslations } from "next-intl/server";

interface FormDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormDetailPage({ params }: FormDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("forms");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">ID: {id}</p>
    </div>
  );
}
