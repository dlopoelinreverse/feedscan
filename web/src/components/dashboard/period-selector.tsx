"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const OPTIONS = [7, 30, 90] as const;

export function PeriodSelector({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setPeriod = (days: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", String(days));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-1">
      {OPTIONS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setPeriod(d)}
          className={cn(
            "px-3 py-1 text-sm font-medium rounded-md transition-colors",
            current === d
              ? "bg-[#6C5CE7] text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {d}j
        </button>
      ))}
    </div>
  );
}
