"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Options {
  staleTimeMs?: number;
  enabled?: boolean;
}

export function useRefreshOnFocus({
  staleTimeMs = 30_000,
  enabled = true,
}: Options = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const maybeRefresh = () => {
      if (document.visibilityState !== "visible") return;
      const elapsed = Date.now() - lastRefreshRef.current;
      if (elapsed < staleTimeMs) return;
      lastRefreshRef.current = Date.now();
      startTransition(() => router.refresh());
    };

    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("focus", maybeRefresh);
    window.addEventListener("pageshow", maybeRefresh);
    return () => {
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("focus", maybeRefresh);
      window.removeEventListener("pageshow", maybeRefresh);
    };
  }, [enabled, router, staleTimeMs]);

  return { isPending };
}
