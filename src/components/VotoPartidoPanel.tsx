import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, classifyApiError } from "../services/api";
import type { ApiStatus, VotacaoVotos } from "../types";

/**
 * Painel de voto por partido para uma votação — busca sob demanda
 * (só quando o card é expandido) via GET /camara/votacoes/{id}/votos.
 * Votações de comissão costumam não ter registro individual de voto
 * (aprovação por consenso) — nesse caso `total` vem 0 e mostramos isso
 * explicitamente em vez de um painel vazio.
 */
export function VotoPartidoPanel({ votacaoId }: { votacaoId: string }) {
  const [status, setStatus] = useState<ApiStatus>("loading");
  const [data, setData] = useState<VotacaoVotos | null>(null);

  function load() {
    let cancelled = false;
    setStatus("loading");
    api.camara.votacaoVotos(votacaoId)
      .then((d) => { if (!cancelled) { setData(d); setStatus("success"); } })
      .catch((e: Error) => { if (!cancelled) setStatus(classifyApiError(e)); });
    return () => { cancelled = true; };
  }
  useEffect(load, [votacaoId]);

  if (status === "loading") {
    return (
      <div className="mt-3 space-y-2 border-t border-slate-900/10 pt-3">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-900/10" />
        <div className="h-2 w-full animate-pulse rounded bg-slate-900/10" />
        <div className="h-2 w-full animate-pulse rounded bg-slate-900/10" />
      </div>
    );
  }

  if (status === "error" || status === "offline" || status === "rate_limited") {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-900/10 pt-3">
        <p className="text-xs text-slate-500">
          {status === "rate_limited" ? "Muitas requisições — aguarde um instante." : "Não foi possível carregar o voto por partido."}
        </p>
        <button
          onClick={load}
          className="flex-shrink-0 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="mt-3 border-t border-slate-900/10 pt-3">
        <p className="text-xs font-semibold text-slate-600">Votação simbólica — sem registro individual</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
          Este tipo de votação (comum em comissões) costuma ser decidido por consenso, sem registro do voto de cada parlamentar.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-slate-900/10 pt-3">
      <p className="text-xs font-semibold text-slate-600">{data.total} votos registrados — por partido</p>
      <div className="space-y-1.5">
        {data.partidos.map((p) => {
          const total = p.sim + p.nao + p.abstencao + p.outros;
          if (total === 0) return null;
          return (
            <div key={p.sigla} className="flex items-center gap-2 text-[11px]">
              <span className="w-16 flex-shrink-0 truncate font-bold text-slate-700">{p.sigla}</span>
              <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                {p.sim > 0 && (
                  <motion.div className="h-full bg-green-400" initial={{ width: 0 }}
                    animate={{ width: `${(p.sim / total) * 100}%` }} transition={{ duration: 0.4 }} />
                )}
                {p.nao > 0 && (
                  <motion.div className="h-full bg-red-400" initial={{ width: 0 }}
                    animate={{ width: `${(p.nao / total) * 100}%` }} transition={{ duration: 0.4, delay: 0.05 }} />
                )}
                {p.abstencao > 0 && (
                  <motion.div className="h-full bg-slate-400" initial={{ width: 0 }}
                    animate={{ width: `${(p.abstencao / total) * 100}%` }} transition={{ duration: 0.4, delay: 0.1 }} />
                )}
                {p.outros > 0 && (
                  <motion.div className="h-full bg-amber-400" initial={{ width: 0 }}
                    animate={{ width: `${(p.outros / total) * 100}%` }} transition={{ duration: 0.4, delay: 0.15 }} />
                )}
              </div>
              <span className="w-28 flex-shrink-0 text-right text-slate-500">
                {p.sim} sim · {p.nao} não{p.abstencao > 0 ? ` · ${p.abstencao} abst.` : ""}{p.outros > 0 ? ` · ${p.outros} outros` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
