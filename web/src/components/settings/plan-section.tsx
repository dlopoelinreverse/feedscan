"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface PlanSectionProps {
  plan: "FREE" | "PRO" | "BUSINESS";
  subscription: {
    renewalDate: string | null;
    cardLast4: string | null;
  };
  proPriceId: string;
  businessPriceId: string;
}

export function PlanSection({
  plan,
  subscription,
  proPriceId,
  businessPriceId,
}: PlanSectionProps) {
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

  const planNames: Record<string, string> = {
    FREE: `${tp("free.name")} — ${tp("free.price")}${tp("free.period")}`,
    PRO: `${tp("pro.name")} — ${tp("pro.price")}${tp("pro.period")}`,
    BUSINESS: `${tp("business.name")} — ${tp("business.price")}${tp("business.period")}`,
  };

  const renewalDate = subscription.renewalDate
    ? new Date(subscription.renewalDate).toLocaleDateString()
    : null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{t("plan.title")}</h2>
      <div
        className="rounded-lg p-5 border-2"
        style={{
          borderColor: "#6C5CE7",
          background:
            plan !== "FREE"
              ? "linear-gradient(135deg, rgba(108,92,231,0.05), rgba(108,92,231,0.02))"
              : undefined,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: "#6C5CE7" }}
            >
              Plan {plan === "FREE" ? tp("free.name") : plan === "PRO" ? tp("pro.name") : tp("business.name")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {planNames[plan]}
            </p>
            {renewalDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("plan.renewal", { date: renewalDate })}
                {subscription.cardLast4 && ` — Visa ****${subscription.cardLast4}`}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {plan !== "FREE" && (
              <button
                onClick={handlePortal}
                disabled={loading === "portal"}
                className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50"
              >
                {loading === "portal" ? "..." : t("plan.stripePortal")}
              </button>
            )}
            {plan === "FREE" && (
              <>
                <button
                  onClick={() => handleCheckout(proPriceId)}
                  disabled={loading === proPriceId}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
                  style={{ backgroundColor: "#6C5CE7" }}
                >
                  {loading === proPriceId ? "..." : t("plan.upgrade", { plan: "Pro" })}
                </button>
                <button
                  onClick={() => handleCheckout(businessPriceId)}
                  disabled={loading === businessPriceId}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
                  style={{ backgroundColor: "#e17055" }}
                >
                  {loading === businessPriceId ? "..." : t("plan.upgrade", { plan: "Business" })}
                </button>
              </>
            )}
            {plan === "PRO" && (
              <button
                onClick={() => handleCheckout(businessPriceId)}
                disabled={loading === businessPriceId}
                className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
                style={{ backgroundColor: "#e17055" }}
              >
                {loading === businessPriceId ? "..." : t("plan.upgrade", { plan: "Business" })}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
