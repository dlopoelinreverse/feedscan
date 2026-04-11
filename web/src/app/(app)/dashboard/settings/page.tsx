import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettingsData } from "@/lib/actions/settings-actions";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const data = await getSettingsData();

  // Determine auth provider
  const provider = user.app_metadata?.provider;
  const authProvider =
    provider === "google" ? "Google OAuth" : "Email / Password";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-6">{t("subtitle")}</p>
      <SettingsClient
        data={data}
        proPriceId={process.env.STRIPE_PRO_PRICE_ID ?? ""}
        businessPriceId={process.env.STRIPE_BUSINESS_PRICE_ID ?? ""}
        authProvider={authProvider}
      />
    </div>
  );
}
