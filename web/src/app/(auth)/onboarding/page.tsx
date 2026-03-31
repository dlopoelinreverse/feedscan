"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/domains";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { full_name: name, business_name: businessName, business_type: businessType },
    });

    window.location.href = getAppUrl("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Welcome to FeedScan</h1>
          <p className="mt-2 text-muted-foreground">Tell us a bit about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="businessName" className="text-sm font-medium">
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Acme Inc."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="businessType" className="text-sm font-medium">
              Business Type
            </label>
            <select
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a type...</option>
              <option value="restaurant">Restaurant / Café</option>
              <option value="retail">Retail</option>
              <option value="hotel">Hotel / Hospitality</option>
              <option value="healthcare">Healthcare</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Setting up..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
