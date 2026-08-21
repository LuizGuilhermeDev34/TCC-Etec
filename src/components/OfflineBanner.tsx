interface OfflineBannerProps {
  source?: string;
  onRetry?: () => void;
  kind?: "offline" | "rate_limited";
}

export function OfflineBanner({ source = "servidor", onRetry, kind = "offline" }: OfflineBannerProps) {
  const title = kind === "rate_limited" ? "Muitas requisições" : "Serviço indisponível";
  const message =
    kind === "rate_limited"
      ? "Este site limita o número de requisições por visitante para não sobrecarregar as fontes oficiais. Aguarde cerca de um minuto e tente de novo — isso não é uma falha da fonte de dados."
      : `Não foi possível conectar à ${source}. O serviço pode estar temporariamente indisponível — tente novamente em instantes.`;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800">{title}</h3>
          <p className="mt-1 text-sm text-amber-700">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
