import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { PatrimonioCard } from "../components/PatrimonioCard";
import { api } from "../services/api";
import { slideInLeft, containerVariants } from "../animations";
import type { ApiStatus, DeputadoDespesa, DeputadoDetail, Proposicao } from "../types";

const PARTY_COLORS: Record<string, string> = {
  PT: "bg-red-100 text-red-700 border-red-200",
  PL: "bg-blue-100 text-blue-700 border-blue-200",
  MDB: "bg-green-100 text-green-700 border-green-200",
  UNIÃO: "bg-slate-200 text-slate-700 border-slate-300",
  PSD: "bg-purple-100 text-purple-700 border-purple-200",
  PSB: "bg-pink-100 text-pink-700 border-pink-200",
  PDT: "bg-orange-100 text-orange-700 border-orange-200",
  PSOL: "bg-rose-100 text-rose-700 border-rose-200",
  PP: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PODE: "bg-sky-100 text-sky-700 border-sky-200",
};
function partyColor(s: string) { return PARTY_COLORS[s] ?? "bg-slate-100 text-slate-600 border-slate-200"; }

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try { return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return iso; }
}

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

const TIPO_COLORS: Record<string, string> = {
  PL:  "bg-blue-50 text-blue-700 border-blue-200",
  PEC: "bg-purple-50 text-purple-700 border-purple-200",
  PDC: "bg-amber-50 text-amber-700 border-amber-200",
  MPV: "bg-red-50 text-red-700 border-red-200",
  REQ: "bg-slate-50 text-slate-600 border-slate-200",
  INC: "bg-teal-50 text-teal-700 border-teal-200",
};
function tipoColor(tipo: string) { return TIPO_COLORS[tipo] ?? "bg-slate-50 text-slate-600 border-slate-200"; }

// Subsídio mensal vigente desde 01/02/2025 (reajuste escalonado pelo Decreto
// Legislativo 172/2022) — não a Lei 13.752/2018, que fixou um valor menor
// (R$ 33.763,00) e ficou superada por reajustes posteriores.
// Fonte: https://www2.camara.leg.br/transparencia/acesso-a-informacao/copy_of_perguntas-frequentes/subsidios
const SALARIO_MENSAL = 46366.19;

export function DeputadoProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deputado, setDeputado] = useState<DeputadoDetail | null>(null);
  const [statusDep, setStatusDep] = useState<ApiStatus>("loading");
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([]);
  const [totalProposicoes, setTotalProposicoes] = useState(0);
  const [statusProp, setStatusProp] = useState<ApiStatus>("loading");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [despesas, setDespesas] = useState<DeputadoDespesa[]>([]);
  const [statusDespesas, setStatusDespesas] = useState<ApiStatus>("loading");

  useEffect(() => {
    if (!id) return;
    const nid = Number(id);
    let cancelled = false;

    setStatusDep("loading");
    api.camara.deputadoById(nid)
      .then((d) => { if (!cancelled) { setDeputado(d); setStatusDep("success"); } })
      .catch((e: Error) => { if (!cancelled) setStatusDep(e.message === "offline" ? "offline" : "error"); });

    setStatusProp("loading");
    api.camara.deputadoProposicoes(nid)
      .then((p) => { if (!cancelled) { setProposicoes(p.itens); setTotalProposicoes(p.total); setStatusProp("success"); } })
      .catch(() => { if (!cancelled) setStatusProp("error"); });

    setStatusDespesas("loading");
    api.camara.deputadoDespesas(nid)
      .then((d) => { if (!cancelled) { setDespesas(d); setStatusDespesas("success"); } })
      .catch(() => { if (!cancelled) setStatusDespesas("error"); });

    return () => { cancelled = true; };
  }, [id]);

  const tiposDisponiveis = Array.from(new Set(proposicoes.map((p) => p.sigla_tipo))).sort();
  const proposicoesFiltradas = tipoFiltro ? proposicoes.filter((p) => p.sigla_tipo === tipoFiltro) : proposicoes;
  const proposicoesVisiveis = proposicoesFiltradas.slice(0, visibleCount);
  const amostraProposicoes = totalProposicoes > proposicoes.length;

  const gastosPorCategoria: Record<string, number> = {};
  let gastosTotal = 0;
  for (const d of despesas) {
    if (d.valor_liquido <= 0) continue;
    gastosPorCategoria[d.tipo_despesa] = (gastosPorCategoria[d.tipo_despesa] ?? 0) + d.valor_liquido;
    gastosTotal += d.valor_liquido;
  }
  const categoriasOrdenadas = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]);

  if (statusDep === "loading") {
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

        {/* Voltar */}
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

        {(statusDep === "offline" || statusDep === "error") && (
          <OfflineBanner source="API da Câmara" onRetry={() => {
            if (!id) return;
            setStatusDep("loading");
            api.camara.deputadoById(Number(id))
              .then((d) => { setDeputado(d); setStatusDep("success"); })
              .catch((e: Error) => setStatusDep(e.message === "offline" ? "offline" : "error"));
          }} />
        )}

        {deputado && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }} className="space-y-5">

            {/* ── CABEÇALHO ── */}
            <SectionCard>
              <div className="h-2 rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-500" />
              <div className="p-6">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  <div className="relative flex-shrink-0">
                    {deputado.url_foto ? (
                      <img src={deputado.url_foto} alt={deputado.nome}
                        className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 ring-4 ring-white shadow-lg">
                        <svg className="h-12 w-12 text-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{deputado.nome}</h1>
                    {deputado.nome_civil && deputado.nome_civil !== deputado.nome && (
                      <p className="mt-0.5 text-xs text-slate-400">{deputado.nome_civil}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${partyColor(deputado.sigla_partido)}`}>
                        {deputado.sigla_partido}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {deputado.sigla_uf}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        Deputado Federal
                      </span>
                      {deputado.descricao_status && (
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          {deputado.descricao_status}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                      {deputado.email && (
                        <a href={`mailto:${deputado.email}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          {deputado.email}
                        </a>
                      )}
                      {deputado.url_website && (
                        <a href={deputado.url_website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
                          </svg>
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── BIOGRAFIA ── */}
            {deputado.biografia && (
              <SectionCard className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  Biografia
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">{deputado.biografia}</p>
                <p className="mt-2 text-[11px] text-slate-400">Fonte: Wikipédia</p>
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
                  <p className="mt-1 text-2xl font-bold text-emerald-800">{formatMoney(SALARIO_MENSAL)}</p>
                  <p className="mt-1 text-[11px] text-emerald-600">≈ {formatMoney(SALARIO_MENSAL * 12)}/ano</p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Valor vigente desde 1º de fevereiro de 2025 (reajuste fixado pelo{" "}
                  Decreto Legislativo 172/2022, escalonado até 2025), igual para todos os 513 deputados
                  federais. Não inclui verbas indenizatórias.{" "}
                  <a
                    href="https://www2.camara.leg.br/transparencia/acesso-a-informacao/copy_of_perguntas-frequentes/subsidios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-slate-600 transition-colors"
                  >
                    Fonte: Câmara dos Deputados
                  </a>
                </p>
              </SectionCard>

              <PatrimonioCard
                fetchPatrimonio={() => api.patrimonio.deputadoFederal(deputado.nome, deputado.nome_civil)}
                tseLink={`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/2022/2040602022/BR/candidatos?nome=${encodeURIComponent(deputado.nome_civil || deputado.nome)}`}
              />
            </div>

            {/* ── PROPOSIÇÕES APRESENTADAS ── */}
            <SectionCard className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <svg className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Proposições Apresentadas</h2>
                  <p className="text-xs text-slate-400">Projetos de lei e requerimentos de autoria do deputado — mais recentes primeiro</p>
                </div>
                {statusProp === "success" && proposicoesFiltradas.length > 0 && (
                  <span className="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700" title="Proposições carregadas nesta lista">
                    {proposicoesFiltradas.length} carregada{proposicoesFiltradas.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {statusProp === "success" && tiposDisponiveis.length > 1 && (
                <div className="mb-4 flex items-center gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tipo</label>
                  <select
                    value={tipoFiltro}
                    onChange={(e) => { setTipoFiltro(e.target.value); setVisibleCount(10); }}
                    className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-600 focus:outline-none"
                  >
                    <option value="">Todos os tipos</option>
                    {tiposDisponiveis.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {statusProp === "loading" && (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Buscando proposições...
                </div>
              )}

              {statusProp === "error" && (
                <p className="py-4 text-sm text-slate-400">Não foi possível carregar as proposições.</p>
              )}

              {statusProp === "success" && proposicoes.length === 0 && (
                <p className="py-4 text-sm text-slate-400">Nenhuma proposição registrada para este deputado.</p>
              )}

              {statusProp === "success" && proposicoes.length > 0 && (
                <>
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                    {proposicoesVisiveis.map((p) => (
                      <motion.div key={p.id} variants={slideInLeft}>
                        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-violet-200 hover:bg-violet-50 transition-colors">
                          <span className={`mt-0.5 flex-shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-bold ${tipoColor(p.sigla_tipo)}`}>
                            {p.sigla_tipo}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-700">
                                {p.numero}/{p.ano}
                                {/* Sem o órgão, requerimentos de comissões diferentes com o mesmo
                                    número parecem duplicatas — cada comissão numera a própria série. */}
                                {p.orgao_situacao && (
                                  <span className="ml-1 font-normal text-slate-400">· {p.orgao_situacao}</span>
                                )}
                              </span>
                              {p.data_apresentacao && (
                                <span className="ml-auto flex-shrink-0 text-[11px] text-slate-400">
                                  {formatDate(p.data_apresentacao)}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{p.ementa}</p>
                          </div>
                          {p.url_inteiro_teor && (
                            <a href={p.url_inteiro_teor} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 text-violet-500 hover:text-violet-700 transition-colors"
                              title="Ver texto completo">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {visibleCount < proposicoesFiltradas.length && (
                    <button
                      onClick={() => setVisibleCount((v) => v + 20)}
                      className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Ver mais ({proposicoesFiltradas.length - visibleCount} restantes nesta lista)
                    </button>
                  )}

                  <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                    {amostraProposicoes && (
                      <>Lista carrega as {proposicoes.length} proposições mais recentes, de {totalProposicoes} no total. </>
                    )}
                    Fonte:{" "}
                    <a
                      href={`https://www.camara.leg.br/deputados/${deputado?.id}/proposicoes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-slate-600 transition-colors"
                    >
                      Câmara dos Deputados — Dados Abertos
                    </a>
                  </p>
                </>
              )}
            </SectionCard>

            {/* ── GASTOS CEAP ── */}
            <SectionCard className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-slate-800">Gastos CEAP</h2>
                <span className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">2025</span>
              </div>

              {statusDespesas === "loading" && (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Buscando despesas...
                </div>
              )}
              {statusDespesas === "error" && (
                <p className="py-4 text-sm text-slate-400">Não foi possível carregar os gastos CEAP.</p>
              )}
              {statusDespesas === "success" && despesas.length === 0 && (
                <p className="py-4 text-sm text-slate-400">
                  Nenhuma despesa CEAP disponível no momento para este período — a Câmara não retornou registros nesta consulta.
                </p>
              )}
              {statusDespesas === "success" && despesas.length > 0 && (
                <div className="space-y-4">
                  <div className="inline-flex items-baseline gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-xs text-slate-500">Total no ano:</span>
                    <span className="text-2xl font-bold text-amber-700">{formatMoney(gastosTotal)}</span>
                  </div>
                  <div className="space-y-2">
                    {categoriasOrdenadas.slice(0, 6).map(([categoria, valor]) => (
                      <div key={categoria}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-slate-600" title={categoria}>{categoria}</span>
                          <span className="flex-shrink-0 font-semibold text-slate-700">{formatMoney(valor)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${(valor / categoriasOrdenadas[0][1]) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">Fonte: Câmara dos Deputados — Dados Abertos (CEAP)</p>
                </div>
              )}
            </SectionCard>

            {/* ── DADOS PESSOAIS + MANDATO ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <SectionCard className="p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                    </svg>
                  </div>
                  Dados Pessoais
                </h2>
                <div className="space-y-0">
                  {/* Campo em branco sugere dado faltando — esconde a linha em vez de "—" */}
                  {[
                    { label: "Nome civil", value: deputado.nome_civil },
                    { label: "Nascimento", value: formatDate(deputado.data_nascimento) },
                    { label: "Naturalidade", value: [deputado.municipio_nascimento, deputado.uf_nascimento].filter(Boolean).join(" / ") || null },
                    { label: "Escolaridade", value: deputado.escolaridade },
                    { label: "Sexo", value: deputado.sexo === "M" ? "Masculino" : deputado.sexo === "F" ? "Feminino" : deputado.sexo },
                  ].filter(({ value }) => Boolean(value)).map(({ label, value }) => (
                    <div key={label} className="flex items-start gap-3 border-b border-slate-50 py-2.5 last:border-0">
                      <span className="w-32 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400 pt-0.5">{label}</span>
                      <span className="text-sm text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard className="p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>
                  Mandato
                </h2>
                <div className="space-y-0">
                  {((): { label: string; value: string | null | undefined }[] => {
                    const rows: { label: string; value: string | null | undefined }[] = [
                      { label: "Partido", value: deputado.sigla_partido },
                      { label: "Estado", value: deputado.sigla_uf },
                      { label: "Legislatura", value: `${deputado.id_legislatura}ª` },
                      { label: "Situação", value: deputado.descricao_status },
                    ];
                    if (deputado.gabinete?.sala) {
                      rows.push({ label: "Gabinete", value: [deputado.gabinete.predio && `Prédio ${deputado.gabinete.predio}`, deputado.gabinete.andar && `Andar ${deputado.gabinete.andar}`, `Sala ${deputado.gabinete.sala}`].filter(Boolean).join(", ") });
                    }
                    if (deputado.gabinete?.telefone) {
                      rows.push({ label: "Telefone", value: deputado.gabinete.telefone });
                    }
                    return rows;
                  })().filter(({ value }) => Boolean(value)).map(({ label, value }) => (
                    <div key={label} className="flex items-start gap-3 border-b border-slate-50 py-2.5 last:border-0">
                      <span className="w-32 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400 pt-0.5">{label}</span>
                      <span className="text-sm text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* ── RODAPÉ ── */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <a href={`https://www.camara.leg.br/deputados/${deputado.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Ver na Câmara dos Deputados
              </a>
            </div>

          </motion.div>
        )}
      </main>
    </PageTransition>
  );
}
