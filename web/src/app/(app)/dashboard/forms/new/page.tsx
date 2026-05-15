import { FormBuilder } from "@/components/forms/form-builder";
import { getUserProfile } from "@/lib/actions/form-actions";
import { listThemes } from "@/lib/actions/theme-actions";

export default async function NewFormPage() {
  const [userProfile, themes] = await Promise.all([
    getUserProfile(),
    listThemes(),
  ]);
  const defaultTheme = themes.find((t) => t.isDefault) ?? themes[0] ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FormBuilder
        userProfile={userProfile ?? undefined}
        themes={themes}
        initialThemeId={defaultTheme?.id ?? null}
      />
    </div>
  );
}
