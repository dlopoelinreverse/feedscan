"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getAuthUrl, getAppUrl, getRootUrl, getAbsoluteAuthUrl } from "@/lib/domains";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    const error = params.get("error");
    if (reason === "please_login") setNotice(t("pleaseLogin"));
    else if (
      error === "auth_callback_error" ||
      error === "missing_code" ||
      error === "stale_session"
    ) {
      setServerError(t("sessionExpired"));
      const supabase = createClient();
      supabase.auth.signOut().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginForm = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: value.email,
        password: value.password,
      });
      if (error) { setServerError(error.message); return; }
      if (data.user) {
        try {
          const res = await fetch("/api/auth/check-onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.user.id, email: data.user.email }),
          });
          const result = await res.json();
          if (!result.hasBusinessName) { window.location.href = getAuthUrl("/onboarding"); return; }
        } catch { /* redirect to dashboard */ }
      }
      window.location.href = getAppUrl("/dashboard");
    },
  });

  const resetForm = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(value.email, {
        redirectTo: getAbsoluteAuthUrl("/login"),
      });
      if (error) { setServerError(error.message); return; }
      setResetSent(true);
    },
  });

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAbsoluteAuthUrl("/api/auth/callback") },
    });
  };

  if (showReset) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
            <div className="flex justify-end"><LanguageSwitcher /></div>
            <div className="text-center">
              <a href={getRootUrl()} className="inline-block">
                <span className="text-3xl font-bold text-primary">FeedScan</span>
              </a>
              <p className="mt-2 text-muted-foreground">{t("resetPassword")}</p>
            </div>
            {resetSent ? (
              <div className="space-y-4 text-center">
                <div className="rounded-md bg-secondary/10 p-4 text-sm text-secondary">{t("resetSent")}</div>
                <button onClick={() => { setShowReset(false); setResetSent(false); }} className="text-sm text-primary hover:underline font-medium">
                  {t("backToLogin")}
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); resetForm.handleSubmit(); }} className="space-y-4">
                {serverError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}
                <resetForm.Field name="email" validators={{ onChange: ({ value }) => { if (!value) return t("emailRequired"); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("invalidEmail"); return undefined; } }}>
                  {(field) => (
                    <div className="space-y-2">
                      <label htmlFor="resetEmail" className="text-sm font-medium">{t("email")}</label>
                      <input id="resetEmail" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder={t("emailPlaceholder")} />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>}
                    </div>
                  )}
                </resetForm.Field>
                <resetForm.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
                  {([canSubmit, isSubmitting]) => (
                    <button type="submit" disabled={!canSubmit} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {isSubmitting ? t("sendingResetLink") : t("sendResetLink")}
                    </button>
                  )}
                </resetForm.Subscribe>
                <p className="text-center"><button type="button" onClick={() => { setShowReset(false); setServerError(null); }} className="text-sm text-muted-foreground hover:text-foreground">← {t("backToLogin")}</button></p>
              </form>
            )}
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
            <p className="mt-2 text-muted-foreground">{t("loginSubtitle")}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); loginForm.handleSubmit(); }} className="space-y-4">
            {notice && <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{notice}</div>}
            {serverError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}
            <loginForm.Field name="email" validators={{ onChange: ({ value }) => { if (!value) return t("emailRequired"); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("invalidEmail"); return undefined; } }}>
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
                  <input id="email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder={t("emailPlaceholder")} />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>}
                </div>
              )}
            </loginForm.Field>
            <loginForm.Field name="password" validators={{ onChange: ({ value }) => { if (!value) return t("passwordRequired"); return undefined; } }}>
              {(field) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
                    <button type="button" onClick={() => { setShowReset(true); setServerError(null); }} className="text-xs text-primary hover:underline">{t("forgotPassword")}</button>
                  </div>
                  <input id="password" type="password" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className="w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>}
                </div>
              )}
            </loginForm.Field>
            <loginForm.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <button type="submit" disabled={!canSubmit} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {isSubmitting ? t("signingIn") : t("signIn")}
                </button>
              )}
            </loginForm.Subscribe>
          </form>
          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-card px-2">{tCommon("or")}</span></div></div>
          <button onClick={handleGoogleLogin} className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            {t("googleLogin")}
          </button>
          <div className="space-y-2 text-center text-sm">
            <p className="text-muted-foreground">{t("noAccount")} <a href={getAuthUrl("/register")} className="text-primary hover:underline font-medium">{t("signUp")}</a></p>
            <p><a href={getRootUrl()} className="text-muted-foreground hover:text-foreground text-xs">← {tNav("backToSite")}</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
