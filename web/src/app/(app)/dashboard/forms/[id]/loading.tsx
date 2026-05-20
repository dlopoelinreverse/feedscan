export default function FormDetailLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl animate-pulse">
      <div className="mb-6">
        <div className="flex items-start gap-2 sm:items-center sm:gap-3 sm:justify-between">
          <div className="flex items-start gap-2 sm:items-center sm:gap-3 min-w-0 flex-1">
            <div className="h-5 w-4 rounded bg-muted shrink-0 mt-1 sm:mt-0" />
            <div className="h-7 w-48 rounded bg-muted" />
            <div className="hidden sm:block h-6 w-16 rounded-full bg-muted shrink-0" />
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="h-10 w-20 rounded bg-muted" />
            <div className="h-10 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
          <div className="h-6 w-16 rounded-full bg-muted" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-8 w-8 rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="inline-flex h-10 items-center rounded-md bg-muted p-1 gap-1">
        <div className="h-7 w-24 rounded-sm bg-background/60" />
        <div className="h-7 w-24 rounded-sm" />
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
