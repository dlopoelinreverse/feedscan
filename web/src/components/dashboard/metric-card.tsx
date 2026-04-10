import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: { value: number; isPositive: boolean; label?: string } | null;
  description?: string;
  emptyMessage?: string;
}

export function MetricCard({ title, value, delta, description, emptyMessage }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {delta && (
        <p
          className={cn(
            "text-xs font-medium",
            delta.isPositive ? "text-[#00B894]" : "text-[#E24B4A]"
          )}
        >
          {delta.isPositive ? "↑" : "↓"} {delta.isPositive ? "+" : ""}
          {delta.value}
          {delta.label ? ` ${delta.label}` : "%"}
        </p>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {emptyMessage && <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>}
    </div>
  );
}
