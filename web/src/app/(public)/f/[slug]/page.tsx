import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <p className="text-muted-foreground text-center">{t("loading")} {slug}</p>
      </div>
    </div>
  );
}
