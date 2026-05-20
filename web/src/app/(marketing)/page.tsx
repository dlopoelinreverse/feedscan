import { getTranslations } from "next-intl/server";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { getAuthUrl } from "@/lib/domains";

export default async function Home() {
  const tNav = await getTranslations("nav");

  return (
    <>
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <a
          href={getAuthUrl("/login")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {tNav("login")}
        </a>
        <LanguageSwitcher />
      </div>
      <main className="flex min-h-screen flex-col bg-background">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
