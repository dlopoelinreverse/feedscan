"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/settings-actions";
import { toast } from "@/hooks/use-toast";

interface ProfileSectionProps {
  user: {
    email: string;
    businessName: string | null;
    businessType: string | null;
  };
  authProvider: string;
}

export function ProfileSection({ user, authProvider }: ProfileSectionProps) {
  const t = useTranslations("settings");
  const [editing, setEditing] = useState(false);
  const [businessName, setBusinessName] = useState(user.businessName ?? "");
  const [businessType, setBusinessType] = useState(user.businessType ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ businessName, businessType });
      toast({ title: t("profileSaved") });
      setEditing(false);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{t("profile.title")}</h2>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">
              {t("profile.businessName")}
            </label>
            {editing ? (
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <p className="mt-1 text-sm font-medium">
                {user.businessName ?? "—"}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              {t("profile.businessType")}
            </label>
            {editing ? (
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <p className="mt-1 text-sm font-medium">
                {user.businessType ?? "—"}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              {t("profile.email")}
            </label>
            <p className="mt-1 text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              {t("profile.connectionMethod")}
            </label>
            <p className="mt-1 text-sm font-medium">{authProvider}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "..." : t("profile.save")}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setBusinessName(user.businessName ?? "");
                  setBusinessType(user.businessType ?? "");
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted"
              >
                {t("cancelEdit")}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted"
            >
              {t("editProfile")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
