"use client";

import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

export function RefreshOnFocus({ staleTimeMs = 30_000 }: { staleTimeMs?: number }) {
  const { isPending } = useRefreshOnFocus({ staleTimeMs });
  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 h-0.5 z-50 pointer-events-none transition-opacity duration-200 ${
        isPending ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full bg-primary animate-pulse origin-left" />
    </div>
  );
}
