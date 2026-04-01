"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl, getRootUrl } from "@/lib/domains";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "salon", label: "Salon" },
  { value: "clinique", label: "Clinique" },
  { value: "gym", label: "Gym" },
  { value: "coworking", label: "Coworking" },
  { value: "autre", label: "Autre" },
];

export default function OnboardingPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Redirect if onboarding already done
  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setChecking(false);
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
        // ignore
      }
      setChecking(false);
    };

    check();
  }, []);

  const form = useForm({
    defaultValues: { businessName: "", businessType: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setServerError("Session expirée. Veuillez vous reconnecter.");
          return;
        }

        // Update Supabase metadata
        await supabase.auth.updateUser({
          data: {
            business_name: value.businessName,
            business_type: value.businessType,
          },
        });

        // Upsert Prisma User
        await fetch("/api/auth/complete-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            businessName: value.businessName,
            businessType: value.businessType,
          }),
        });

        window.location.href = getAppUrl("/dashboard");
      } catch {
        setServerError("Une erreur est survenue. Veuillez réessayer.");
      }
    },
  });

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-muted-foreground text-sm animate-pulse">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <a href={getRootUrl()} className="inline-block">
              <span className="text-3xl font-bold text-primary">FeedScan</span>
            </a>
            <p className="mt-2 text-lg font-semibold">Bienvenue !</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Parlez-nous de votre commerce pour personnaliser votre expérience.
            </p>
          </div>

          {/* Form */}
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

            {/* Business name */}
            <form.Field
              name="businessName"
              validators={{
                onBlur: ({ value }) => {
                  if (!value.trim()) return "Le nom du commerce est requis.";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="businessName" className="text-sm font-medium">
                    Nom du commerce
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Mon Restaurant"
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

            {/* Business type */}
            <form.Field
              name="businessType"
              validators={{
                onBlur: ({ value }) => {
                  if (!value) return "Veuillez sélectionner un type d'activité.";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="businessType" className="text-sm font-medium">
                    Type d&apos;activité
                  </label>
                  <select
                    id="businessType"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Sélectionnez...</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
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

            {/* Submit */}
            <form.Subscribe
              selector={(s) => [s.canSubmit, s.isSubmitting] as const}
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Configuration..." : "Commencer"}
                </button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  );
}
