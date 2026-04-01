"use client";

import { useState, useEffect } from "react";
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
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If businessName is already set, redirect immediately
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in — stay on page (proxy will handle redirect)
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
        // Ignore errors, let user complete onboarding
      }
      setChecking(false);
    };

    checkOnboarding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError("Veuillez entrer le nom de votre commerce.");
      return;
    }
    if (!businessType) {
      setError("Veuillez sélectionner un type d'activité.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      // Update Supabase user metadata
      await supabase.auth.updateUser({
        data: {
          business_name: businessName,
          business_type: businessType,
        },
      });

      // Update Prisma User record
      await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          businessName,
          businessType,
        }),
      });

      window.location.href = getAppUrl("/dashboard");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-muted-foreground text-sm animate-pulse">Chargement...</div>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">
                Nom du commerce
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Mon Restaurant"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="businessType" className="text-sm font-medium">
                Type d&apos;activité
              </label>
              <select
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sélectionnez...</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Configuration..." : "Commencer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
