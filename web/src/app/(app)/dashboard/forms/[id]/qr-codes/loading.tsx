export default function QRCodesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="h-6 w-64 max-w-full rounded bg-muted" />
          <div className="h-4 w-80 max-w-full rounded bg-muted" />
        </div>
        <div className="h-10 w-full sm:w-44 rounded bg-muted" />
      </div>

      <div className="space-y-3">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
