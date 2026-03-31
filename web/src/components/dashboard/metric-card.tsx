interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
