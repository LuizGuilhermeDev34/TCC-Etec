import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { api, classifyApiError } from "../services/api";
import { containerVariants, slideInLeft, cardHover } from "../animations";
import type { ApiStatus, Partido } from "../types";

const SIGLA_COLORS: Record<string, { bg: string; text: string }> = {
  PT:            { bg: "bg-red-500",    text: "text-white" },
  PL:            { bg: "bg-blue-500",   text: "text-white" },
  MDB:           { bg: "bg-green-500",  text: "text-white" },
  UNIÃO:         { bg: "bg-slate-700",  text: "text-white" },
  PSD:           { bg: "bg-slate-500",  text: "text-white" },
  PSB:           { bg: "bg-pink-500",   text: "text-white" },
  PDT:           { bg: "bg-orange-500", text: "text-white" },
  PSOL:          { bg: "bg-rose-500",   text: "text-white" },
  REPUBLICANOS:  { bg: "bg-violet-600", text: "text-white" },
  PP:            { bg: "bg-yellow-500", text: "text-white" },
  PODE:          { bg: "bg-sky-500",    text: "text-white" },
  AVANTE:        { bg: "bg-teal-500",   text: "text-white" },
  SOLIDARIEDADE: { bg: "bg-amber-500",  text: "text-white" },
  PV:            { bg: "bg-lime-600",   text: "text-white" },
  CIDADANIA:     { bg: "bg-cyan-600",   text: "text-white" },
  PATRIOTA:      { bg: "bg-emerald-600",text: "text-white" },
  AGIR:          { bg: "bg-indigo-500", text: "text-white" },
};

function getColor(sigla: string) {
  return SIGLA_COLORS[sigla] ?? { bg: "bg-blue-400", text: "text-white" };
}

function initials(sigla: string) {
  return sigla.length <= 2 ? sigla : sigla.slice(0, 2);
}

export function PartidosPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [status, setStatus] = useState<ApiStatus>("idle");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setStatus("loading");
    api.camara.partidos()
      .then((d) => { setPartidos(d); setStatus("success"); })
      .catch((e: Error) => setStatus(classifyApiError(e)));
  }, []);

  const filtered = partidos.filter(
    (p) =>
      p.sigla?.toLowerCase().includes(query.toLowerCase()) ||
      p.nome?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-bold text-slate-900">Partidos Políticos</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Explore informações sobre os partidos <span className="font-medium text-blue-600">políticos brasileiros</span>
          </p>
        </motion.div>

        {status === "loading" && <LoadingSpinner message="Carregando partidos..." count={9} />}
        {(status === "offline" || status === "error" || status === "rate_limited") && (
          <OfflineBanner
            source="API da Câmara"
            kind={status === "rate_limited" ? "rate_limited" : "offline"}
            onRetry={() => {
              setStatus("loading");
              api.camara.partidos()
                .then((d) => { setPartidos(d); setStatus("success"); })
                .catch((e: Error) => setStatus(classifyApiError(e)));
            }}
          />
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-5"
            >
              <input
                type="search"
                placeholder="Buscar partido..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((p) => {
                const { bg, text } = getColor(p.sigla);
                return (
                  <Link key={p.id} to={`/partidos/${p.id}`} className="block">
                    <motion.div
                      variants={slideInLeft}
                      whileHover={cardHover}
                      className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden h-full"
                    >
                      {/* Faixa de cor no topo */}
                      <div className={`h-1.5 w-full ${bg}`} />

                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Logo do partido */}
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                            {p.urlLogo ? (
                              <img
                                src={p.urlLogo}
                                alt={p.sigla}
                                className="h-12 w-12 object-contain"
                                onError={(e) => {
                                  const el = e.currentTarget.parentElement!;
                                  e.currentTarget.remove();
                                  el.className = `flex h-14 w-14 items-center justify-center rounded-xl text-sm font-bold ${bg} ${text}`;
                                  el.textContent = initials(p.sigla);
                                }}
                              />
                            ) : (
                              <div className={`flex h-full w-full items-center justify-center rounded-xl text-sm font-bold ${bg} ${text}`}>
                                {initials(p.sigla)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">{p.sigla}</p>
                            <p className="text-xs text-slate-500 leading-snug">{p.nome}</p>
                          </div>

                          {/* Seta */}
                          <svg className="h-4 w-4 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>

                        {/* Membros */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                            </svg>
                            <span className="font-medium text-slate-600">Membros:</span>
                          </div>
                          {p.totalMembros != null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-medium">
                                {((p.totalMembros / 513) * 100).toFixed(1)}%
                              </span>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${bg} ${text}`}>
                                {p.totalMembros}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
              {filtered.length === 0 && query && (
                <p className="col-span-3 py-10 text-center text-sm text-slate-400">
                  Nenhum partido encontrado para "{query}"
                </p>
              )}
            </motion.div>
          </>
        )}
      </main>
    </PageTransition>
  );
}
