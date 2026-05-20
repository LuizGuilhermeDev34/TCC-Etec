import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { DonutChart } from "../components/DonutChart";
import { PatrimonioCard } from "../components/PatrimonioCard";
import { api } from "../services/api";
import { containerVariants, slideInLeft } from "../animations";
import type { ApiStatus, DeputadoVotacao, Senador } from "../types";

const PARTY_COLORS: Record<string, string> = {
  PT: "bg-red-100 text-red-700", PL: "bg-blue-100 text-blue-700",
  MDB: "bg-green-100 text-green-700", UNIÃO: "bg-slate-200 text-slate-700",
  PSD: "bg-purple-100 text-purple-700", PSB: "bg-pink-100 text-pink-700",
  PDT: "bg-orange-100 text-orange-700", PSOL: "bg-rose-100 text-rose-700",
  PP: "bg-yellow-100 text-yellow-700", PODE: "bg-sky-100 text-sky-700",
};
function partyColor(s: string) { return PARTY_COLORS[s] ?? "bg-slate-100 text-slate-600"; }

function voteColor(tipo: string) {
  const t = tipo.toLowerCase();
  if (t === "sim" || t.includes("favor")) return { bg: "bg-green-100", text: "text-green-700", label: "A favor" };
  if (t === "não" || t === "nao" || t.includes("contra")) return { bg: "bg-red-100", text: "text-red-700", label: "Contra" };
  if (t.includes("absten")) return { bg: "bg-slate-100", text: "text-slate-600", label: "Abstenção" };
  if (t.includes("secreto")) return { bg: "bg-slate-100", text: "text-slate-500", label: "Voto Secreto" };
  return { bg: "bg-orange-100", text: "text-orange-700", label: tipo };
}

function computeStats(votacoes: DeputadoVotacao[]) {
  let sim = 0, nao = 0, abstencao = 0, outro = 0;
  for (const v of votacoes) {
    const t = v.tipo_voto.toLowerCase();
    if (t === "sim" || t.includes("favor")) sim++;
    else if (t === "não" || t === "nao" || t.includes("contra")) nao++;
    else if (t.includes("absten")) abstencao++;
    else outro++;
  }
  const total = votacoes.length;
  const presenca = total > 0 ? Math.round(((sim + nao + abstencao) / total) * 100) : 0;
  return { sim, nao, abstencao, outro, total, presenca };
}

export function SenadorProfilePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();

  const [senador, setSenador] = useState<Senador | null>(null);
  const [statusSen, setStatusSen] = useState<ApiStatus>("loading");

  const [votacoes, setVotacoes] = useState<DeputadoVotacao[]>([]);
  const [statusVot, setStatusVot] = useState<ApiStatus>("loading");

  useEffect(() => {
    if (!codigo) return;
    // Load senator from the list (we match by código)
    setStatusSen("loading");
    api.senado.senadores()
      .then((list) => {
        const found = list.find((s) => s.codigo === codigo);
        if (found) { setSenador(found); setStatusSen("success"); }
        else setStatusSen("error");
      })
      .catch((e: Error) => setStatusSen(e.message === "offline" ? "offline" : "error"));

    // Load votações
    setStatusVot("loading");
    api.senado.senadorVotacoes(codigo)
      .then((v) => { setVotacoes(v); setStatusVot("success"); })
      .catch(() => setStatusVot("error"));
  }, [codigo]);

  const stats = computeStats(votacoes);

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </motion.button>

        {statusSen === "loading" && <LoadingSpinner message="Carregando perfil..." count={3} />}
        {(statusSen === "offline" || statusSen === "error") && (
          <OfflineBanner source="API do Senado" />
        )}

        {statusSen === "success" && senador && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">

            {/* ── HEADER ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="flex-shrink-0">
                  {senador.url_foto ? (
                    <img src={senador.url_foto} alt={senador.nome}
                      className="h-28 w-28 rounded-full object-cover ring-4 ring-blue-100 shadow-md"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100">
                      <svg className="h-14 w-14 text-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-slate-900">{senador.nome}</h1>
                  {senador.nome_completo && senador.nome_completo !== senador.nome && (
                    <p className="mt-0.5 text-sm text-slate-400">{senador.nome_completo}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${partyColor(senador.partido)}`}>{senador.partido}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{senador.uf}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Senad{senador.sexo === "Feminino" ? "ora" : "or"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    {senador.email && (
                      <a href={`mailto:${senador.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        {senador.email}
                      </a>
                    )}
                    {senador.url_pagina && (
                      <a href={senador.url_pagina} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
                        </svg>
                        Página no Senado
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── VOTING STATS ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                Estatísticas de Votação — 2026
                {statusVot === "loading" && <span className="ml-1 text-xs font-normal text-slate-400">carregando...</span>}
              </h2>

              {statusVot === "success" && stats.total > 0 && (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="flex flex-col items-center gap-3">
                    <DonutChart slices={[
                      { value: stats.sim, color: "#22c55e", label: "A favor" },
                      { value: stats.nao, color: "#ef4444", label: "Contra" },
                      { value: stats.abstencao, color: "#94a3b8", label: "Abstenção" },
                      { value: stats.outro, color: "#f59e0b", label: "Outro" },
                    ]} />
                    <div className="flex flex-wrap justify-center gap-2 text-xs">
                      {[{ color: "bg-green-500", label: "A favor" }, { color: "bg-red-500", label: "Contra" }, { color: "bg-slate-400", label: "Abstenção" }].map((l) => (
                        <span key={l.label} className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${l.color}`} />
                          {l.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Taxa de Presença</p>
                      <p className="mt-1 text-4xl font-bold text-slate-900">{stats.presenca} <span className="text-2xl text-slate-500">%</span></p>
                      <p className="mt-0.5 text-xs text-slate-400">{stats.total} votações analisadas</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "A favor", pct: stats.total ? Math.round((stats.sim / stats.total) * 100) : 0, color: "text-green-600" },
                        { label: "Contra", pct: stats.total ? Math.round((stats.nao / stats.total) * 100) : 0, color: "text-red-600" },
                        { label: "Abstenção", pct: stats.total ? Math.round((stats.abstencao / stats.total) * 100) : 0, color: "text-slate-500" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                          <p className={`text-xl font-bold ${s.color}`}>{s.pct} %</p>
                          <p className="text-[11px] text-slate-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {statusVot === "success" && stats.total === 0 && (
                <p className="text-sm text-slate-400">Nenhuma votação encontrada para 2026.</p>
              )}
              {statusVot === "error" && (
                <p className="text-sm text-slate-400">Dados de votação indisponíveis para este senador.</p>
              )}
            </div>

            {/* ── GASTOS CEAPS ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-slate-800">Cota Parlamentar (CEAPS)</h2>
              </div>

              <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Cota mensal máxima</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">R$&nbsp;33.752,34</p>
                <p className="mt-1 text-[11px] text-emerald-600">Varia conforme o estado do senador</p>
              </div>

              <div className="mb-4 space-y-1.5 text-xs text-slate-600">
                {["Passagens aéreas e terrestres", "Hospedagem e alimentação", "Combustível e locação de veículos", "Consultoria, pesquisa e divulgação"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>

              <a
                href={`https://www.senado.leg.br/transparencia/LAI/verba/VerbasIndenizatorias.asp?bSenador=${codigo}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors w-full"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Ver despesas detalhadas no portal do Senado
              </a>
              <p className="mt-2 text-[11px] text-slate-400">
                Fonte:{" "}
                <a href="https://www.senado.leg.br/transparencia/LAI/verba/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 transition-colors">
                  Portal de Transparência do Senado Federal
                </a>
              </p>
            </div>

            {/* ── PATRIMÔNIO ── */}
            <PatrimonioCard
              fetchPatrimonio={() => api.patrimonio.senador(senador.nome_completo || senador.nome)}
              tseLink={`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/2022/2040602022/BR/candidatos?nome=${encodeURIComponent(senador.nome_completo || senador.nome)}`}
            />

            {/* ── HISTÓRICO POLÍTICO ── */}
            {statusVot === "success" && votacoes.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Histórico Político
                  </h2>
                  <a
                    href={`https://legis.senado.leg.br/dadosabertos/senador/${codigo}/votacoes`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline"
                  >
                    Fonte
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                  {[...votacoes].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")).slice(0, 15).map((v, i) => {
                    const vc = voteColor(v.tipo_voto);
                    const label = v.proposicao_sigla && v.proposicao_numero
                      ? `${v.proposicao_sigla} ${v.proposicao_numero}/${v.proposicao_ano}`
                      : null;
                    return (
                      <motion.div key={v.id || i} variants={slideInLeft} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-800 flex items-center justify-center">
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </div>
                          {i < Math.min(votacoes.length, 15) - 1 && <div className="mt-1 w-0.5 flex-1 bg-slate-200" style={{ minHeight: "16px" }} />}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">VOTAÇÃO</span>
                            <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${vc.bg} ${vc.text}`}>{vc.label}</span>
                            {v.data && <span className="text-xs text-slate-400">{new Date(v.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>}
                          </div>
                          {label && <p className="font-semibold text-sm text-slate-800">{label}</p>}
                          {v.proposicao_ementa && (
                            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{v.proposicao_ementa}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}

            {/* Senado link */}
            <div className="flex justify-end">
              {senador.url_pagina && (
                <a href={senador.url_pagina} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Ver no Senado Federal
                </a>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </PageTransition>
  );
}
