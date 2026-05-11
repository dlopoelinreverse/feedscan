import { getTranslations } from "next-intl/server";
import { getAuthUrl } from "@/lib/domains";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default async function Home() {
  const t = await getTranslations("landing.hero");
  const tNav = await getTranslations("nav");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <a href={getAuthUrl("/login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tNav("login")}</a>
        <LanguageSwitcher />
      </div>
      <div className="text-center space-y-6 px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary">FeedScan</h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-md">{t("subtitle")}</p>
        <div className="flex flex-row gap-3 sm:gap-4 justify-center">
          <a href={getAuthUrl("/register")} className="bg-primary text-primary-foreground px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-lg font-medium hover:opacity-90 transition-opacity">{t("cta")}</a>
          <a href="#how-it-works" className="border border-border px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-lg font-medium hover:bg-muted transition-colors">{t("demo")}</a>
        </div>
      </div>
    </main>
  );
}
