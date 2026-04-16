"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface FreePlanBannerProps {
  used: number;
  limit: number;
}

export function FreePlanBanner({ used, limit }: FreePlanBannerProps) {
  const t = useTranslations("settings");

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 mb-4">
      <p className="text-sm text-amber-800">
        {t("limits.freeBanner", { used, limit })}
      </p>
      <Link
        href="/dashboard/settings"
        className="shrink-0 px-3 py-1.5 text-xs font-medium text-white rounded-md"
        style={{ backgroundColor: "#6C5CE7" }}
      >
        {t("limits.upgradeToProCta")}
      </Link>
    </div>
  );
}
