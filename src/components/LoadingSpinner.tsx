interface LoadingSpinnerProps {
  message?: string;
  count?: number;
}

export function LoadingSpinner({ message = "Carregando dados...", count = 6 }: LoadingSpinnerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        <p className="text-sm text-slate-500">{message}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 h-10 w-10 rounded-full bg-slate-200" />
            <div className="mb-2 h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
