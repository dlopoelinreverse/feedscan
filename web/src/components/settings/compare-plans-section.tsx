"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ComparePlansSectionProps {
  currentPlan: "FREE" | "PRO" | "BUSINESS";
  proPriceId: string;
  businessPriceId: string;
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-green-500 mt-0.5">&#10003;</span>
      <span>{text}</span>
    </div>
  );
}

export function ComparePlansSection({
  currentPlan,
  proPriceId,
  businessPriceId,
}: ComparePlansSectionProps) {
  const t = useTranslations("settings");
  const tp = useTranslations("pricing");
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      key: "FREE" as const,
      name: tp("free.name"),
      price: tp("free.price"),
      period: tp("free.period"),
      features: [
        tp("free.features.forms"),
        tp("free.features.responses"),
        tp("free.features.qrCodes"),
        tp("free.features.stats"),
        tp("free.features.ai"),
      ],
    },
    {
      key: "PRO" as const,
      name: tp("pro.name"),
      price: tp("pro.price"),
      period: tp("pro.period"),
      features: [
        tp("pro.features.forms"),
        tp("pro.features.responses"),
        tp("pro.features.qrCodes"),
        tp("pro.features.stats"),
        tp("pro.features.ai"),
      ],
    },
    {
      key: "BUSINESS" as const,
      name: tp("business.name"),
      price: tp("business.price"),
      period: tp("business.period"),
      features: [
        tp("business.features.forms"),
        tp("business.features.multiLocation"),
        tp("business.features.export"),
        tp("business.features.branding"),
        tp("business.features.support"),
      ],
    },
  ];

  const planOrder = { FREE: 0, PRO: 1, BUSINESS: 2 };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{t("comparePlans.title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isUpgrade = planOrder[plan.key] > planOrder[currentPlan];
          const isDowngrade = planOrder[plan.key] < planOrder[currentPlan];

          return (
            <div
              key={plan.key}
              className="relative rounded-lg border-2 p-5 flex flex-col"
              style={{
                borderColor: isCurrent ? "#6C5CE7" : "var(--border)",
              }}
            >
              {isCurrent && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold text-white rounded-full"
                  style={{ backgroundColor: "#6C5CE7" }}
                >
                  {t("plan.currentPlan")}
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-1 mb-4">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {plan.features.map((feature, i) => (
                  <CheckItem key={i} text={feature} />
                ))}
              </div>
              <div className="mt-5">
                {isCurrent && (
                  <button
                    disabled
                    className="w-full py-2 text-sm font-medium border border-border rounded-md text-muted-foreground bg-muted cursor-not-allowed"
                  >
                    {t("plan.current")}
                  </button>
                )}
                {isUpgrade && (
                  <button
                    onClick={() =>
                      handleCheckout(
                        plan.key === "PRO" ? proPriceId : businessPriceId
                      )
                    }
                    disabled={loading !== null}
                    className="w-full py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
                    style={{ backgroundColor: "#6C5CE7" }}
                  >
                    {loading
                      ? "..."
                      : t("plan.upgrade", { plan: plan.name })}
                  </button>
                )}
                {isDowngrade && (
                  <button
                    onClick={handlePortal}
                    disabled={loading === "portal"}
                    className="w-full py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50"
                  >
                    {loading === "portal" ? "..." : t("plan.downgrade")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
