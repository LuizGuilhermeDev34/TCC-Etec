import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { PatrimonioCard } from "../components/PatrimonioCard";
import { api } from "../services/api";
import type { ApiStatus, DeputadoEstadual } from "../types";

const PARTY_COLORS: Record<string, string> = {
  PT: "bg-red-100 text-red-700 border-red-200",
  PL: "bg-blue-100 text-blue-700 border-blue-200",
  MDB: "bg-green-100 text-green-700 border-green-200",
  UNIÃO: "bg-slate-200 text-slate-700 border-slate-300",
  PSD: "bg-purple-100 text-purple-700 border-purple-200",
  PSB: "bg-pink-100 text-pink-700 border-pink-200",
  PDT: "bg-orange-100 text-orange-700 border-orange-200",
  PSOL: "bg-rose-100 text-rose-700 border-rose-200",
  REPUBLICANOS: "bg-violet-100 text-violet-700 border-violet-200",
  PP: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PODEMOS: "bg-sky-100 text-sky-700 border-sky-200",
  PSDB: "bg-blue-100 text-blue-700 border-blue-200",
  CIDADANIA: "bg-indigo-100 text-indigo-700 border-indigo-200",
};
function partyColor(s: string) { return PARTY_COLORS[s.toUpperCase()] ?? "bg-slate-100 text-slate-600 border-slate-200"; }

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// Subsídio mensal dos deputados estaduais de SP fixado pela ALESP
// Equivale a 75% do subsídio de deputado federal (Lei Complementar SP)
const SALARIO_MENSAL_ESTADUAL = 34774.64;

export function DeputadoEstadualProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deputado, setDeputado] = useState<DeputadoEstadual | null>(null);
  const [status, setStatus] = useState<ApiStatus>("loading");

  useEffect(() => {
    if (!id) return;
    setStatus("loading");
    api.estaduais.deputadoById(Number(id))
      .then((d) => { setDeputado(d); setStatus("success"); })
      .catch((e: Error) => setStatus(e.message === "offline" ? "offline" : "error"));
  }, [id]);

  if (status === "loading") {
    return (
      <PageTransition direction="up">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingSpinner message="Carregando perfil..." count={3} />
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        <motion.button
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </motion.button>

        {(status === "offline" || status === "error") && (
          <OfflineBanner source="API Estadual" onRetry={() => {
            if (!id) return;
            setStatus("loading");
            api.estaduais.deputadoById(Number(id))
              .then((d) => { setDeputado(d); setStatus("success"); })
              .catch((e: Error) => setStatus(e.message === "offline" ? "offline" : "error"));
          }} />
        )}

        {deputado && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }} className="space-y-5">

            {/* ── CABEÇALHO ── */}
            <SectionCard>
              <div className="h-2 rounded-t-2xl bg-gradient-to-r from-violet-600 to-purple-500" />
              <div className="p-6">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 ring-4 ring-white shadow-lg">
                    <svg className="h-12 w-12 text-violet-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                    </svg>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{deputado.nome}</h1>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${partyColor(deputado.partido)}`}>
                        {deputado.partido}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {deputado.uf}
                      </span>
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        Deputado Estadual · ALESP
                      </span>
                    </div>


                    {deputado.email && (
                      <div className="mt-3 flex justify-center sm:justify-start">
                        <a href={`mailto:${deputado.email}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          {deputado.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── BIOGRAFIA ── */}
            {deputado.biografia && (
              <SectionCard className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                    <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  Biografia
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">{deputado.biografia}</p>
              </SectionCard>
            )}

            {/* ── REMUNERAÇÃO E PATRIMÔNIO ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <SectionCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Remuneração</h2>
                </div>
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Subsídio mensal</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">{formatMoney(SALARIO_MENSAL_ESTADUAL)}</p>
                  <p className="mt-1 text-[11px] text-emerald-600">≈ {formatMoney(SALARIO_MENSAL_ESTADUAL * 12)}/ano</p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Subsídio limitado a 75% do subsídio federal conforme a Constituição do Estado de SP.
                </p>
              </SectionCard>

              <PatrimonioCard
                fetchPatrimonio={() => api.patrimonio.deputadoEstadual(deputado.nome, deputado.uf)}
                tseLink={`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/2022/2040602022/SP/candidatos?nome=${encodeURIComponent(deputado.nome)}`}
              />
            </div>

            {/* ── MANDATO ── */}
            <SectionCard className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                Mandato
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Partido", value: deputado.partido },
                  { label: "Estado", value: deputado.uf },
                  { label: "Casa", value: "ALESP" },
                  { label: "Período", value: deputado.mandato },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── RODAPÉ ── */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
              {deputado.url_pagina && (
                <a href="https://www.al.sp.gov.br" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Ver na ALESP
                </a>
              )}
            </div>

          </motion.div>
        )}
      </main>
    </PageTransition>
  );
}
