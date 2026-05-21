import { getTranslations } from "next-intl/server";

interface DemoBannerProps {
  expiresAt: Date;
}

export async function DemoBanner({ expiresAt }: DemoBannerProps) {
  const t = await getTranslations("demo.banner");
  const msLeft = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.round(msLeft / (60 * 60 * 1000)));

  return (
    <div className="sticky top-0 z-40 w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs sm:text-sm text-amber-900">
      <span className="font-medium">{t("mode")}</span>
      <span className="mx-1">·</span>
      <span>{t("expires", { hours: hoursLeft })}</span>
    </div>
  );
}
