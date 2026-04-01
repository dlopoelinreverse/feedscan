"use client";

import { useTranslations } from "next-intl";
import { type Form } from "@/types";

interface PublicFormProps {
  form: Form;
}

export function PublicForm({ form }: PublicFormProps) {
  const t = useTranslations("publicForm");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground mt-1">{form.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>
    </div>
  );
}
