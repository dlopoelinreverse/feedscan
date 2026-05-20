"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/hooks/use-toast";
import { createAndSignInDemoAccount } from "@/lib/actions/demo-actions";

export function TryDemoButton() {
  const t = useTranslations("landing.hero");
  const [isPending, startTransition] = useTransition();
  const [forcedLoading, setForcedLoading] = useState(false);
  const loading = isPending || forcedLoading;

  const handleClick = () => {
    setForcedLoading(true);
    startTransition(async () => {
      try {
        await createAndSignInDemoAccount();
      } catch (err) {
        setForcedLoading(false);
        const message = err instanceof Error ? err.message : "";
        if (message === "rate_limited") {
          toast({
            title: t("tryDemoRateLimited"),
            variant: "destructive",
          });
          return;
        }
        if (message === "NEXT_REDIRECT") {
          // redirect() throws this; not an error.
          return;
        }
        toast({
          title: t("tryDemoError"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 border border-border px-8 py-3 rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("tryDemoLoading")}
        </>
      ) : (
        t("tryDemo")
      )}
    </button>
  );
}
