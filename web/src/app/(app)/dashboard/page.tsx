import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("dashboard");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">{t("welcome")}, {user?.email}</p>
    </div>
  );
}
