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
}

export function SettingsClient({
  data,
  proPriceId,
  businessPriceId,
  authProvider,
}: SettingsClientProps) {
  const t = useTranslations("settings");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [successBanner, setSuccessBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: t("subscriptionActive") });
      setSuccessBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      router.replace(url.pathname, { scroll: false });
    } else if (searchParams.get("canceled") === "true") {
      toast({ title: t("subscriptionCanceled"), variant: "destructive" });
      const url = new URL(window.location.href);
      url.searchParams.delete("canceled");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router, t]);

  return (
    <div className="space-y-8 max-w-4xl">
      {successBanner && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
          {t("subscriptionActive")}
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
