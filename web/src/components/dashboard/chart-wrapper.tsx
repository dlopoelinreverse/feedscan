interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
}

export function ChartWrapper({ title, children }: ChartWrapperProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}
