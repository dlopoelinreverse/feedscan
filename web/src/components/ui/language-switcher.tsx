"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();

  const setLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className={cn("inline-flex items-center rounded-md border border-border text-xs", className)}>
      <button
        onClick={() => setLocale("fr")}
        className={cn(
          "px-2 py-1 rounded-l-md transition-colors font-medium",
          locale === "fr"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-2 py-1 rounded-r-md transition-colors font-medium",
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
}
