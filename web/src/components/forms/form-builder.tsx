"use client";

import { useTranslations } from "next-intl";

export function FormBuilder() {
  const t = useTranslations("forms");

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t("builder.titlePlaceholder")}</p>
    </div>
  );
}
