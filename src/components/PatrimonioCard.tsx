import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ApiStatus, Patrimonio } from "../types";

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  fetchPatrimonio: () => Promise<Patrimonio>;
  tseLink: string;
}

export function PatrimonioCard({ fetchPatrimonio, tseLink }: Props) {
  const [patrimonio, setPatrimonio] = useState<Patrimonio | null>(null);
  const [status, setStatus] = useState<ApiStatus>("idle");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchPatrimonio()
      .then((p) => { if (!cancelled) { setPatrimonio(p); setStatus("success"); } })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, []);

  const categorias = patrimonio ? Object.entries(patrimonio.categorias) : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
          <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-800">Patrimônio Declarado</h2>
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Consultando TSE...
        </div>
      )}

      {status === "success" && patrimonio && patrimonio.total > 0 && (
        <>
          {/* Total */}
          <div className="rounded-xl bg-amber-50 px-4 py-3 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Total declarado ao TSE (2022)</p>
            <p className="mt-1 text-2xl font-bold text-amber-800">{formatMoney(patrimonio.total)}</p>
          </div>

          {/* Categorias */}
          {categorias.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Por categoria</p>
              {categorias.slice(0, 5).map(([tipo, valor]) => {
                const pct = patrimonio.total > 0 ? Math.round((valor / patrimonio.total) * 100) : 0;
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-600 truncate max-w-[60%]">{tipo}</span>
                      <span className="text-xs font-semibold text-slate-700 ml-1">{formatMoney(valor)}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full bg-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Fonte:{" "}
            <a
              href={tseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600 transition-colors"
            >
              {patrimonio.fonte}
            </a>
          </p>
          <p className="mt-1 text-[11px] text-slate-300">
            Será atualizado após as eleições de outubro de 2026.
          </p>
        </>
      )}

      {(status === "error" || (status === "success" && (!patrimonio || patrimonio.total === 0))) && (
        <>
          <p className="text-xs text-slate-500 mb-3">
            Dados não disponíveis via API. Consulte a declaração completa diretamente no TSE.
          </p>
          <a
            href={tseLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors w-full justify-center"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Ver declaração no TSE
          </a>
        </>
      )}
    </div>
  );
}
