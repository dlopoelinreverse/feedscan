"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl, getAuthUrl, getRootUrl } from "@/lib/domains";
import { PresetThumbnail } from "@/components/themes/preset-thumbnail";
import { PRESETS, PRESET_ORDER } from "@/lib/themes/presets";
import type { ThemePresetId } from "@/lib/themes/types";

const BUSINESS_TYPE_KEYS = [
  "restaurant",
  "cafe",
  "salon",
  "clinique",
  "gym",
  "coworking",
  "autre",
] as const;

type Step = "business" | "theme";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tThemes = useTranslations("themes");
  const [serverError, setServerError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>("business");
  const [themePreset, setThemePreset] = useState<ThemePresetId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<{
    businessName: string;
    businessType: string;
  } | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = getAuthUrl("/login?reason=please_login");
          return;
        }
        const res = await fetch("/api/auth/check-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, email: user.email }),
        });
        const result = await res.json();
        if (result.hasBusinessName) {
          window.location.href = getAppUrl("/dashboard");
          return;
        }
      } catch {
        /* ignore */
      }
      setChecking(false);
    };
    check();
  }, []);

  const finalize = async (preset: ThemePresetId | null) => {
    if (!pendingValues) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = getAuthUrl("/login?reason=please_login");
        return;
      }
      await supabase.auth.updateUser({
        data: {
          business_name: pendingValues.businessName,
          business_type: pendingValues.businessType,
        },
      });
      const res = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          businessName: pendingValues.businessName,
          businessType: pendingValues.businessType,
          themePreset: preset ?? "minimal",
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = getAuthUrl("/login?reason=please_login");
          return;
        }
        setServerError(tAuth("sessionExpired"));
        setSubmitting(false);
        return;
      }
      window.location.href = getAppUrl("/dashboard");
    } catch {
      setServerError(tCommon("error"));
      setSubmitting(false);
    }
  };

  const form = useForm({
    defaultValues: { businessName: "", businessType: "" },
    onSubmit: async ({ value }) => {
      setPendingValues(value);
      setStep("theme");
    },
  });

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">
          {tCommon("loading")}
        </div>
      </div>
    );
  }

  if (step === "theme") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="text-center">
              <a href={getRootUrl()} className="inline-block">
                <span className="text-3xl font-bold text-primary">FeedScan</span>
              </a>
              <p className="mt-3 text-lg font-semibold">
                {t("theme.title")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("theme.subtitle")}
              </p>
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRESET_ORDER.map((id) => {
                const active = themePreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setThemePreset(id)}
                    className={`rounded-lg border p-2 text-left transition-colors min-h-[44px] ${
                      active
                        ? "border-foreground ring-2 ring-foreground/15"
                        : "border-border hover:border-foreground/60"
                    }`}
                  >
                    <PresetThumbnail
                      config={PRESETS[id]}
                      label={tThemes(`presets.${id}.name`)}
                    />
                    <p className="text-xs font-medium mt-2">
                      {tThemes(`presets.${id}.name`)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => finalize(null)}
                disabled={submitting}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("theme.later")}
              </button>
              <button
                type="button"
                onClick={() => finalize(themePreset ?? "minimal")}
                disabled={submitting}
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? t("settingUp") : t("theme.continue")}
              </button>
            </div>

            <p className="text-[11px] text-center text-muted-foreground">
              {t("theme.reassuring")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center">
            <a href={getRootUrl()} className="inline-block">
              <span className="text-3xl font-bold text-primary">FeedScan</span>
            </a>
            <p className="mt-2 text-lg font-semibold">{t("welcome")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}
            <form.Field
              name="businessName"
              validators={{
                onBlur: ({ value }) => {
                  if (!value.trim()) return t("businessNameRequired");
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor="businessName"
                    className="text-sm font-medium"
                  >
                    {t("businessName")}
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t("businessNamePlaceholder")}
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                </div>
              )}
            </form.Field>
            <form.Field
              name="businessType"
              validators={{
                onBlur: ({ value }) => {
                  if (!value) return t("businessTypeRequired");
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor="businessType"
                    className="text-sm font-medium"
                  >
                    {t("businessType")}
                  </label>
                  <select
                    id="businessType"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{t("selectPlaceholder")}</option>
                    {BUSINESS_TYPE_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`types.${key}`)}
                      </option>
                    ))}
                  </select>
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                </div>
              )}
            </form.Field>
            <form.Subscribe
              selector={(s) => [s.canSubmit, s.isSubmitting] as const}
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? t("settingUp") : tCommon("next")}
                </button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  );
}
