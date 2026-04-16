"use client";

import { useTranslations } from "next-intl";

interface UsageSectionProps {
  plan: "FREE" | "PRO" | "BUSINESS";
  usage: {
    forms: { count: number; limit: number | null };
    responses: { used: number; limit: number | null };
    ai: { used: number; limit: number | null };
  };
}

function UsageBar({
  label,
  used,
  limit,
  color,
}: {
  label: string;
  used: number;
  limit: number | null;
  color: string;
}) {
  const t = useTranslations("common");
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 30;
  const isWarning = limit && used / limit > 0.8;
  const isCritical = limit && used / limit > 0.95;
  const barColor = isCritical ? "#e74c3c" : isWarning ? "#e17055" : color;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs font-bold">{used}</span>
        <span className="text-xs text-muted-foreground">
          {limit ? `/ ${limit}` : t("unlimited").toLowerCase()}
        </span>
      </div>
    </div>
  );
}

export function UsageSection({ plan, usage }: UsageSectionProps) {
  const t = useTranslations("settings");

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{t("usage.title")}</h2>
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <UsageBar
          label={t("usage.forms")}
          used={usage.forms.count}
          limit={usage.forms.limit}
          color="#6C5CE7"
        />
        <UsageBar
          label={t("usage.responses")}
          used={usage.responses.used}
          limit={usage.responses.limit}
          color="#00B894"
        />
        <UsageBar
          label={t("usage.aiGenerations")}
          used={usage.ai.used}
          limit={usage.ai.limit}
          color="#FDCB6E"
        />
      </div>
    </section>
  );
}
