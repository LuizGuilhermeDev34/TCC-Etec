import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { api } from "../services/api";
import { containerVariants, slideInLeft } from "../animations";
import type { Activity, ApiStatus } from "../types";

type Tab = "tudo" | "votacoes" | "proposicoes";

const GLOSSARIO: Record<string, { nome: string; descricao: string }> = {
  PL:      { nome: "Projeto de Lei",                   descricao: "Proposta de criação ou alteração de lei ordinária. Apresentada por deputados, senadores ou pelo Executivo." },
  PEC:     { nome: "Emenda Constitucional",             descricao: "Altera a Constituição Federal. Exige aprovação de 3/5 dos parlamentares em dois turnos de votação." },
  MPV:     { nome: "Medida Provisória",                 descricao: "Lei temporária editada pelo Presidente com força imediata, válida por 60 dias (prorrogável). Precisa ser aprovada pelo Congresso." },
  MP:      { nome: "Medida Provisória",                 descricao: "Lei temporária editada pelo Presidente com força imediata, válida por 60 dias (prorrogável). Precisa ser aprovada pelo Congresso." },
  PDL:     { nome: "Decreto Legislativo",               descricao: "Ato do Congresso que não precisa de sanção presidencial. Usado para aprovar tratados internacionais, sustar atos do Executivo, etc." },
  PLP:     { nome: "Lei Complementar",                  descricao: "Complementa a Constituição em temas específicos. Exige maioria absoluta — mais da metade de todos os parlamentares." },
  REQ:     { nome: "Requerimento",                      descricao: "Pedido formal feito por deputado ou partido — pode ser de urgência, adiamento, convocação de ministro, pedido de informações, etc." },
  PROC:    { nome: "Processo Interno",                  descricao: "Documento administrativo de tramitação interna da Câmara — comunicados, indicações ou registros procedimentais que não têm força de lei." },
  MSC:     { nome: "Mensagem do Executivo",             descricao: "Comunicado oficial enviado pelo Presidente da República ao Congresso. Pode ser envio de projetos, informações ou vetos." },
  INC:     { nome: "Indicação",                         descricao: "Sugestão dirigida ao Poder Executivo para que tome alguma providência. Não tem força de lei obrigatória." },
  PLEN:    { nome: "Plenário",                          descricao: "Sessão com todos os deputados presentes. Decisões aqui têm peso máximo e geralmente são definitivas." },
  CCJ:     { nome: "Comissão de Constituição e Justiça", descricao: "Analisa se as proposições são constitucionais antes de irem ao plenário." },
  CLP:     { nome: "Comissão de Legislação Participativa", descricao: "Recebe e analisa sugestões de cidadãos e organizações da sociedade civil para criação de leis." },
  CFT:     { nome: "Comissão de Finanças e Tributação", descricao: "Analisa o impacto financeiro e tributário das proposições antes de irem a votação." },
  CDHM:    { nome: "Comissão de Direitos Humanos",      descricao: "Analisa proposições relativas a direitos humanos, minorias étnicas e grupos vulneráveis." },
  CSSF:    { nome: "Comissão de Seguridade Social e Família", descricao: "Analisa proposições sobre saúde, previdência social, assistência social e direitos da família." },
  CTASP:   { nome: "Comissão de Trabalho",              descricao: "Analisa proposições sobre direitos trabalhistas, emprego e serviço público." },
  CMULHER: { nome: "Comissão de Defesa dos Direitos da Mulher", descricao: "Comissão permanente dedicada a proposições relacionadas aos direitos e à proteção da mulher." },
};

function siglaInfo(s: string) { return GLOSSARIO[s.toUpperCase()] ?? null; }
function siglaLabel(s: string) { return GLOSSARIO[s.toUpperCase()]?.nome ?? s; }

function SiglaTooltip({ sigla, className }: { sigla: string; className?: string }) {
  const info = siglaInfo(sigla);
  return (
    <div className="relative group/stip inline-block">
      <span className={`cursor-default rounded border px-1.5 py-0.5 text-[10px] font-bold ${className ?? "border-blue-200 bg-blue-50 text-blue-700"}`}>
        {sigla}
        {info && <span className="ml-0.5 text-[8px] opacity-40">?</span>}
      </span>
      {info && (
        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-56 rounded-lg border border-slate-100 bg-white p-3 shadow-xl opacity-0 group-hover/stip:opacity-100 transition-opacity duration-150">
          <p className="text-xs font-bold text-slate-800">{sigla} — {info.nome}</p>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{info.descricao}</p>
        </div>
      )}
    </div>
  );
}

const PROP_SIGLAS = ["PL", "PEC", "MPV", "MP", "PDL", "PLP", "REQ", "MSC", "INC", "PRC"];

function extractPropSigla(title: string, desc: string): string | null {
  const first = title.split(/[\s/]/)[0].toUpperCase();
  if (PROP_SIGLAS.includes(first)) return first;
  const map: [RegExp, string][] = [
    [/projeto de lei complementar/i, "PLP"],
    [/projeto de lei/i, "PL"],
    [/proposta de emenda constitucional/i, "PEC"],
    [/medida provis[oó]ria/i, "MPV"],
    [/decreto legislativo/i, "PDL"],
    [/lei complementar/i, "PLP"],
  ];
  for (const [re, sigla] of map) {
    if (re.test(desc)) return sigla;
  }
  return null;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function fmtTime(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function fmtNow(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── Card de atividade ─────────────────────────────────────────────────────────

function ActivityCard({ a }: { a: Activity }) {
  const isVot = a.type === "votacao";
  const approved = a.aprovacao === 1;
  const time = fmtTime(a.date);
  const date = fmtDate(a.date);

  const borderCls = isVot
    ? approved ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
    : "border-blue-100 bg-white";

  const titleSigla = a.title.split(/[\s/]/)[0].toUpperCase();
  const titleRest = a.title.slice(titleSigla.length).trim();
  const propSigla = isVot ? extractPropSigla(a.title, a.description) : null;

  return (
    <motion.div variants={slideInLeft} className={`flex-1 rounded-xl border p-4 shadow-sm ${borderCls}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isVot ? (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${approved ? "bg-green-500" : "bg-red-500"}`}>
              {approved ? "✓ Aprovado" : "✗ Rejeitado"}
            </span>
          ) : (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
              Nova proposição
            </span>
          )}
          {isVot && propSigla && <SiglaTooltip sigla={propSigla} className="border-slate-300 bg-white text-slate-600" />}
          {isVot && !propSigla && (
            <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              Procedural
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            {isVot ? siglaLabel(a.actor) : "Câmara dos Deputados"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>{date}</span>
          {time && <><span className="opacity-40">·</span><span className="font-medium text-slate-500">{time}</span></>}
        </div>
      </div>

      <p className={`font-semibold text-sm ${isVot ? (approved ? "text-green-900" : "text-red-900") : "text-slate-900"}`}>
        {!isVot && GLOSSARIO[titleSigla] ? (
          <span className="inline-flex flex-wrap items-baseline gap-1.5">
            <SiglaTooltip sigla={titleSigla} />
            <span>{titleRest}</span>
          </span>
        ) : (
          a.title
        )}
      </p>
      <p className={`mt-1 text-xs leading-relaxed line-clamp-2 ${isVot ? (approved ? "text-green-800" : "text-red-800") : "text-slate-500"}`}>
        {a.description || "Sem descrição disponível"}
      </p>
    </motion.div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ activities }: { activities: Activity[] }) {
  const votacoes = activities.filter((a) => a.type === "votacao");
  const proposicoes = activities.filter((a) => a.type === "proposicao");
  const aprovadas = votacoes.filter((a) => a.aprovacao === 1).length;
  const rejeitadas = votacoes.filter((a) => a.aprovacao === 0).length;
  const total = votacoes.length;

  const orgaos: Record<string, number> = {};
  votacoes.forEach((a) => {
    if (a.sigla_orgao) orgaos[a.sigla_orgao] = (orgaos[a.sigla_orgao] ?? 0) + 1;
  });
  const topOrgaos = Object.entries(orgaos).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-4">

      {/* Resumo votações */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Resumo — últimos 30 dias</p>
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-2xl font-bold text-slate-800">{total}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">votações</p>
          </div>
          <div className="rounded-xl bg-green-50 p-3">
            <p className="text-2xl font-bold text-green-600">{aprovadas}</p>
            <p className="text-[10px] text-green-500 mt-0.5">aprovadas</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-2xl font-bold text-red-500">{rejeitadas}</p>
            <p className="text-[10px] text-red-400 mt-0.5">rejeitadas</p>
          </div>
        </div>

        {total > 0 && (
          <>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">Taxa de aprovação</p>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((aprovadas / total) * 100)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] font-semibold text-green-600">
              {Math.round((aprovadas / total) * 100)}%
            </p>
          </>
        )}
      </div>

      {/* Votações por órgão */}
      {topOrgaos.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Mais ativos</p>
          <div className="space-y-2">
            {topOrgaos.map(([orgao, count]) => (
              <div key={orgao}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">{orgao}</span>
                    <span className="ml-1.5 text-[10px] text-slate-400">{siglaLabel(orgao)}</span>
                  </div>
                  <span className="font-bold text-slate-600">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((count / topOrgaos[0][1]) * 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposições recentes */}
      {proposicoes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Proposições recentes</p>
          <div className="space-y-3">
            {proposicoes.slice(0, 5).map((p, i) => {
              const sigla = p.title.split(/[\s/]/)[0].toUpperCase();
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <SiglaTooltip sigla={sigla} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function AtividadesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<ApiStatus>("idle");
  const [tab, setTab] = useState<Tab>("tudo");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function load(silent = false) {
    if (!silent) setStatus("loading");
    setRefreshing(true);
    api.atividades.recentes()
      .then((d) => {
        setActivities(d);
        setStatus("success");
        setLastUpdated(new Date());
        setRefreshing(false);
      })
      .catch((e: Error) => {
        setStatus(e.message === "offline" ? "offline" : "error");
        setRefreshing(false);
      });
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const filtered = activities.filter((a) => {
    if (tab === "votacoes") return a.type === "votacao";
    if (tab === "proposicoes") return a.type === "proposicao";
    return true;
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "tudo", label: "Tudo", count: activities.length },
    { key: "votacoes", label: "Votações", count: activities.filter((a) => a.type === "votacao").length },
    { key: "proposicoes", label: "Proposições", count: activities.filter((a) => a.type === "proposicao").length },
  ];

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Atividades recentes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Votações e proposições da <span className="font-medium text-blue-600">Câmara dos Deputados</span> em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`h-2 w-2 rounded-full ${refreshing ? "bg-amber-400 animate-pulse" : "bg-green-400 animate-pulse"}`} />
                Atualizado às {fmtNow(lastUpdated)} · auto-refresh 15 min
              </span>
            )}
            <button
              onClick={() => load()}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            >
              <svg className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Atualizar
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 pb-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {status === "success" && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t.key ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {status === "loading" && <LoadingSpinner message="Carregando atividades..." count={5} />}
        {(status === "offline" || status === "error") && (
          <OfflineBanner source="API da Câmara" onRetry={() => load()} />
        )}

        {status === "success" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Feed — 2/3 */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="relative"
                >
                  <div className="space-y-4">
                    {filtered.length === 0 && (
                      <p className="py-12 text-center text-sm text-slate-400">Nenhuma atividade nesta categoria.</p>
                    )}
                    {filtered.map((a, i) => (
                      <motion.div key={i} variants={slideInLeft}>
                        <ActivityCard a={a} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar — 1/3 */}
            <div className="lg:col-span-1">
              <Sidebar activities={activities} />
            </div>

          </div>
        )}
      </main>
    </PageTransition>
  );
}
