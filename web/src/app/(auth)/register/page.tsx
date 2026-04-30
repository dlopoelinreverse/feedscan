"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getAuthUrl, getRootUrl, getAbsoluteAuthUrl } from "@/lib/domains";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: value.email,
        password: value.password,
        options: { emailRedirectTo: getAbsoluteAuthUrl("/api/auth/callback") },
      });
      if (error) { setServerError(error.message); return; }

      // If a session was created (email confirmation disabled), proceed to onboarding.
      // Otherwise show a "check your email" screen.
      if (data.session) {
        window.location.href = getAuthUrl("/onboarding");
      } else {
        setCheckEmail(value.email);
      }
    },
  });

  const handleGoogleRegister = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAbsoluteAuthUrl("/api/auth/callback") },
    });
  };

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6 text-center">
            <div className="flex justify-end"><LanguageSwitcher /></div>
            <a href={getRootUrl()} className="inline-block"><span className="text-3xl font-bold text-primary">FeedScan</span></a>
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t("checkEmailTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("checkEmailMessage", { email: checkEmail })}</p>
              <p className="text-xs text-muted-foreground">{t("checkEmailHint")}</p>
            </div>
            <div className="text-center">
              <a href={getAuthUrl("/login")} className="text-sm text-primary hover:underline">{t("backToLogin")}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="flex justify-end"><LanguageSwitcher /></div>
          <div className="text-center">
            <a href={getRootUrl()} className="inline-block"><span className="text-3xl font-bold text-primary">FeedScan</span></a>
            <p className="mt-2 text-muted-foreground">{t("registerSubtitle")}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
            {serverError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}
            <form.Field name="email" validators={{ onChange: ({ value }) => { if (!value) return t("emailRequired"); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("invalidEmail"); return undefined; } }}>
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
                  <input id="email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder={t("emailPlaceholder")} />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>}
                </div>
              )}
            </form.Field>
            <form.Field name="password" validators={{ onChange: ({ value }) => { if (!value) return t("passwordRequired"); if (value.length < 8) return t("passwordMinLength"); return undefined; } }}>
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
                  <input id="password" type="password" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder={t("passwordPlaceholder")} />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>}
                </div>
              )}
            </form.Field>
            <form.Field name="confirmPassword" validators={{ onChangeListenTo: ["password"], onChange: ({ value, fieldApi }) => { const pw = fieldApi.form.getFieldValue("password"); if (!value) return t("confirmRequired"); if (value !== pw) return t("passwordMismatch"); return undefined; } }}>
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">{t("confirmPassword")}</label>
                  <input id="confirmPassword" type="password" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder={t("confirmPasswordPlaceholder")} />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>}
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <button type="submit" disabled={!canSubmit} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {isSubmitting ? t("signingUp") : t("signUp")}
                </button>
              )}
            </form.Subscribe>
          </form>
          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-card px-2">{tCommon("or")}</span></div></div>
          <button onClick={handleGoogleRegister} className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            {t("googleRegister")}
          </button>
          <div className="space-y-2 text-center text-sm">
            <p className="text-muted-foreground">{t("hasAccount")} <a href={getAuthUrl("/login")} className="text-primary hover:underline font-medium">{t("signIn")}</a></p>
            <p><a href={getRootUrl()} className="text-muted-foreground hover:text-foreground text-xs">← {tNav("backToSite")}</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
