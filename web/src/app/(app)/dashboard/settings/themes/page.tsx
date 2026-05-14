import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listThemes } from "@/lib/actions/theme-actions";
import { ThemesClient } from "@/components/themes/themes-client";

export default async function ThemesSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const themes = await listThemes();

  return <ThemesClient initialThemes={themes} />;
}
