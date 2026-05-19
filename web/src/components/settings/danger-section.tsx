"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/lib/actions/settings-actions";
import { getRootUrl } from "@/lib/domains";

export function DangerSection() {
  const t = useTranslations("settings");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmWord = t("danger.confirmWord");
  const canDelete = confirmText === confirmWord;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await deleteAccount();
      window.location.href = getRootUrl();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <section>
      <div className="border border-red-200 rounded-lg p-6 bg-red-50/50">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          {t("danger.title")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("danger.description")}
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
          >
            {t("danger.deleteAccount")}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">
              {t("danger.typeToConfirm", { word: confirmWord })}
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmWord}
              className="w-full max-w-xs rounded-md border border-red-300 bg-background px-3 py-2 text-base sm:text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "..." : t("danger.confirmDelete")}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted"
              >
                {t("cancelEdit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
