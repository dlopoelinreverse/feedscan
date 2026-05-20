"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ProfileSection } from "./profile-section";
import { PlanSection } from "./plan-section";
import { UsageSection } from "./usage-section";
import { ComparePlansSection } from "./compare-plans-section";
import { DangerSection } from "./danger-section";

export interface SettingsData {
  user: {
    id: string;
    email: string;
    businessName: string | null;
    businessType: string | null;
    plan: "FREE" | "PRO" | "BUSINESS";
    stripeCustomerId: string | null;
  };
  subscription: {
    renewalDate: string | null;
    cardLast4: string | null;
  };
  usage: {
    forms: { count: number; limit: number | null };
    responses: { used: number; limit: number | null };
    ai: { used: number; limit: number | null };
  };
}

interface SettingsClientProps {
  data: SettingsData;
  proPriceId: string;
  businessPriceId: string;
  authProvider: string;
  checkoutSuccess?: boolean;
  checkoutCanceled?: boolean;
}

export function SettingsClient({
  data,
  proPriceId,
  businessPriceId,
  authProvider,
  checkoutSuccess = false,
  checkoutCanceled = false,
}: SettingsClientProps) {
  const t = useTranslations("settings");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [successBanner, setSuccessBanner] = useState(checkoutSuccess);
  const [canceledBanner, setCanceledBanner] = useState(checkoutCanceled);

  useEffect(() => {
    const stripeSessionId = searchParams.get("stripe_session_id");
    const stripeCanceled = searchParams.get("stripe_canceled");
    const legacySuccess = searchParams.get("success");
    const legacyCanceled = searchParams.get("canceled");

    if (stripeSessionId || legacySuccess === "true") {
      toast({ title: t("subscriptionActive") });
      setSuccessBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_session_id");
      url.searchParams.delete("success");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    } else if (stripeCanceled === "1" || legacyCanceled === "true") {
      toast({ title: t("subscriptionCanceled"), variant: "destructive" });
      setCanceledBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_canceled");
      url.searchParams.delete("canceled");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }, [searchParams, router, t]);

  return (
    <div className="space-y-8 max-w-4xl">
      {successBanner && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
          {t("subscriptionActive")}
        </div>
      )}
      {canceledBanner && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm font-medium">
          {t("subscriptionCanceled")}
        </div>
      )}

      <ProfileSection
        user={data.user}
        authProvider={authProvider}
      />

      <PlanSection
        plan={data.user.plan}
        subscription={data.subscription}
        proPriceId={proPriceId}
        businessPriceId={businessPriceId}
      />

      <UsageSection
        plan={data.user.plan}
        usage={data.usage}
      />

      <ComparePlansSection
        currentPlan={data.user.plan}
        proPriceId={proPriceId}
        businessPriceId={businessPriceId}
      />

      <DangerSection />
    </div>
  );
}
