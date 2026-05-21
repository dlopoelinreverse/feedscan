import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettingsData } from "@/lib/actions/settings-actions";
import { syncUserFromCheckoutSession } from "@/lib/billing-sync";
import { SettingsClient } from "@/components/settings/settings-client";

interface SettingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const t = await getTranslations("settings");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const sessionIdParam = params.stripe_session_id;
  const sessionId = Array.isArray(sessionIdParam)
    ? sessionIdParam[0]
    : sessionIdParam;
  const canceled = params.stripe_canceled === "1";

  // Defensive sync: if the user is bouncing back from Stripe Checkout, make
  // sure the DB row reflects the new subscription even if the webhook is late.
  if (sessionId) {
    await syncUserFromCheckoutSession({ userId: user.id, sessionId });
  }

  const data = await getSettingsData();

  const provider = user.app_metadata?.provider;
  const authProvider =
    provider === "google"
      ? t("authProvider.googleOAuth")
      : t("authProvider.emailPassword");

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-6">{t("subtitle")}</p>
      <SettingsClient
        data={data}
        proPriceId={process.env.STRIPE_PRO_PRICE_ID ?? ""}
        businessPriceId={process.env.STRIPE_BUSINESS_PRICE_ID ?? ""}
        authProvider={authProvider}
        checkoutSuccess={Boolean(sessionId)}
        checkoutCanceled={canceled}
      />
    </div>
  );
}
