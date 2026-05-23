import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { api } from "../services/api";
import { containerVariants, slideInLeft, cardHover } from "../animations";
import type { ApiStatus, Proposicao, Votacao } from "../types";

type Tab = "proposicoes" | "votacoes";

const TIPOS: { value: string; label: string }[] = [
  { value: "",    label: "Todos os tipos" },
  { value: "PL",  label: "Projeto de Lei (PL)" },
  { value: "PEC", label: "Emenda Constitucional (PEC)" },
  { value: "MPV", label: "Medida Provisória (MPV)" },
  { value: "MP",  label: "Medida Provisória (MP)" },
  { value: "PDL", label: "Decreto Legislativo (PDL)" },
  { value: "PLP", label: "Lei Complementar (PLP)" },
];

const TIPO_COLORS: Record<string, string> = {
  PL:  "bg-blue-50 text-blue-700 border-blue-200",
  PEC: "bg-purple-50 text-purple-700 border-purple-200",
  MP:  "bg-orange-50 text-orange-700 border-orange-200",
  MPV: "bg-orange-50 text-orange-700 border-orange-200",
  PDL: "bg-green-50 text-green-700 border-green-200",
  PLP: "bg-teal-50 text-teal-700 border-teal-200",
};

const GLOSSARIO: Record<string, { nome: string; descricao: string }> = {
  PL:   { nome: "Projeto de Lei", descricao: "Proposta de criação ou alteração de lei ordinária. Apresentada por deputados, senadores ou pelo Executivo." },
  PEC:  { nome: "Proposta de Emenda Constitucional", descricao: "Altera a Constituição Federal. Exige aprovação de 3/5 dos parlamentares em dois turnos de votação." },
  MPV:  { nome: "Medida Provisória", descricao: "Lei temporária editada pelo Presidente da República com força imediata, válida por 60 dias (prorrogável por mais 60). Precisa ser aprovada pelo Congresso." },
  MP:   { nome: "Medida Provisória", descricao: "Lei temporária editada pelo Presidente da República com força imediata, válida por 60 dias (prorrogável por mais 60). Precisa ser aprovada pelo Congresso." },
  PDL:  { nome: "Projeto de Decreto Legislativo", descricao: "Ato do Congresso que não precisa de sanção presidencial. Usado para aprovar tratados internacionais, sustar atos do Executivo, etc." },
  PLP:  { nome: "Projeto de Lei Complementar", descricao: "Complementa a Constituição em temas específicos (tributário, financeiro, etc.). Exige maioria absoluta — mais da metade de todos os parlamentares." },
  REQ:  { nome: "Requerimento", descricao: "Pedido formal feito por deputado ou partido. Pode ser pedido de urgência (para votar mais rápido), adiamento, convocação de ministro, pedido de informações, etc." },
  PROC: { nome: "Processo Interno", descricao: "Documento administrativo de tramitação interna da Câmara — comunicados, indicações ou registros procedimentais que não têm força de lei." },
  MSC:  { nome: "Mensagem do Executivo", descricao: "Comunicado oficial enviado pelo Presidente da República ao Congresso. Pode ser envio de projetos, informações ou vetos." },
  INC:  { nome: "Indicação", descricao: "Sugestão dirigida ao Poder Executivo para que tome alguma providência. Não tem força de lei obrigatória." },
  PLEN:    { nome: "Plenário", descricao: "Sessão com todos os deputados presentes. É a forma mais importante de votação — as decisões aqui têm peso máximo e geralmente são definitivas." },
  CCJ:     { nome: "Comissão de Constituição e Justiça", descricao: "Comissão permanente que analisa se as proposições são constitucionais antes de irem ao plenário." },
  CFT:     { nome: "Comissão de Finanças e Tributação", descricao: "Analisa o impacto financeiro e tributário das proposições antes de irem a votação." },
  // ── Comissões permanentes da Câmara ──────────────────────────────────────
  CLP:     { nome: "Comissão de Legislação Participativa", descricao: "Recebe e analisa sugestões de cidadãos, entidades e organizações da sociedade civil para criação de leis." },
  CMULHER: { nome: "Comissão de Defesa dos Direitos da Mulher", descricao: "Comissão permanente dedicada a proposições relacionadas aos direitos e à proteção da mulher." },
  CDHM:    { nome: "Comissão de Direitos Humanos e Minorias", descricao: "Analisa proposições relativas a direitos humanos, minorias étnicas, pessoas com deficiência e grupos vulneráveis." },
  CAPADR:  { nome: "Comissão de Agricultura e Reforma Agrária", descricao: "Analisa proposições relacionadas à agricultura, pecuária, abastecimento e desenvolvimento rural." },
  CMEIO:   { nome: "Comissão de Meio Ambiente", descricao: "Analisa proposições sobre meio ambiente, desenvolvimento sustentável e recursos naturais." },
  CEC:     { nome: "Comissão de Educação", descricao: "Analisa proposições relacionadas à educação, cultura, desporto, ciência e tecnologia." },
  CSPCCO:  { nome: "Comissão de Segurança Pública", descricao: "Analisa proposições sobre segurança pública, combate ao crime e sistema penitenciário." },
  CSSF:    { nome: "Comissão de Seguridade Social e Família", descricao: "Analisa proposições sobre saúde, previdência social, assistência social e direitos da família." },
  CTASP:   { nome: "Comissão de Trabalho e Serviço Público", descricao: "Analisa proposições sobre direitos trabalhistas, emprego, serviço público e previdência do servidor." },
  CINDRA:  { nome: "Comissão de Integração Nacional", descricao: "Analisa proposições sobre desenvolvimento regional, infraestrutura e integração nacional." },
};

function tipoColor(t: string) {
  return TIPO_COLORS[t] ?? "bg-slate-50 text-slate-600 border-slate-200";
}

function fmtDate(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function fmtDateTime(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function buildDataInicio(mes: number, ano: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ── Sigla tooltip ─────────────────────────────────────────────────────────────

function SiglaTooltip({ sigla, className }: { sigla: string; className?: string }) {
  const info = GLOSSARIO[sigla.toUpperCase()];
  const cls = className ?? tipoColor(sigla);
  return (
    <div className="relative group/tip inline-block">
      <span className={`cursor-default rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>
        {sigla}
        {info && <span className="ml-1 text-[9px] opacity-40">?</span>}
      </span>
      {info && (
        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-slate-100 bg-white p-3 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
          <p className="text-xs font-bold text-slate-800">{sigla} — {info.nome}</p>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{info.descricao}</p>
        </div>
      )}
    </div>
  );
}

// Extrai a sigla do primeiro token de um proposicao_objeto ("REQ 7/2026 PLP10821" → "REQ")
function extractSigla(propObj: string): string {
  return propObj.split(/[\s/]/)[0].toUpperCase();
}

// ── Card de votação ───────────────────────────────────────────────────────────

function VotacaoCard({ v }: { v: Votacao }) {
  const approved = v.aprovacao === 1;
  const propSigla = v.proposicao_objeto ? extractSigla(v.proposicao_objeto) : null;
  const propInfo = propSigla ? GLOSSARIO[propSigla] : null;

  // Descrições genéricas que não explicam o que foi votado
  const desc = (v.descricao || "").trim();
  const isGeneric = /^(aprovad[oa]|rejeitad[oa]|mantido o texto|prejudicad[oa])\.?$/i.test(desc);

  const badgeCls = approved
    ? "border-green-300 bg-green-100 text-green-800"
    : "border-red-300 bg-red-100 text-red-800";
  const orgaoCls = approved
    ? "border-green-200 bg-green-200 text-green-700"
    : "border-red-200 bg-red-200 text-red-700";

  return (
    <motion.div
      variants={slideInLeft}
      className={`rounded-xl border px-5 py-4 shadow-sm ${
        approved ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Proposição votada — com tooltip explicando a sigla */}
            {v.proposicao_objeto && (
              <div className="relative group/prop inline-flex items-center gap-1">
                <span className={`rounded border px-2 py-0.5 text-xs font-semibold font-mono ${badgeCls}`}>
                  {v.proposicao_objeto}
                </span>
                {propInfo && (
                  <>
                    <span className={`text-[10px] opacity-40 cursor-help ${approved ? "text-green-800" : "text-red-800"}`}>?</span>
                    <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-slate-100 bg-white p-3 shadow-xl opacity-0 group-hover/prop:opacity-100 transition-opacity duration-150">
                      <p className="text-xs font-bold text-slate-800">{propSigla} — {propInfo.nome}</p>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{propInfo.descricao}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Órgão (ex: PLEN) — com tooltip */}
            <SiglaTooltip sigla={v.sigla_orgao} className={orgaoCls} />

            <span className="text-xs text-slate-500">{fmtDateTime(v.data_hora_registro)}</span>
          </div>

          <p className={`text-sm font-medium leading-relaxed ${approved ? "text-green-900" : "text-red-900"}`}>
            {desc || "Votação sem descrição"}
          </p>

          {/* Quando a descrição é vaga, mostra o que a sigla significa para dar contexto */}
          {isGeneric && propInfo && (
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed border-t border-current border-opacity-10 pt-2">
              <span className="font-semibold">{propInfo.nome}:</span>{" "}
              {propInfo.descricao}
            </p>
          )}
        </div>

        <span className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm ${
          approved ? "bg-green-500" : "bg-red-500"
        }`}>
          {approved ? "✓ Aprovado" : "✗ Rejeitado"}
        </span>
      </div>
    </motion.div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

function statusStyle(status: string | undefined): string {
  if (!status) return "bg-slate-100 text-slate-500";
  const s = status.toLowerCase();
  if (s.includes("norma jurídica") || s.includes("aprovad") || s.includes("sancionad") || s.includes("transformad"))
    return "bg-green-100 text-green-700";
  if (
    s.includes("arquivad") || s.includes("retirad") || s.includes("prejudicad") ||
    s.includes("rejeitad") || s.includes("encerrad")
  )
    return "bg-red-100 text-red-700";
  // active tramitation statuses (aguardando, prorrogação, pauta, relator, etc.)
  return "bg-amber-100 text-amber-700";
}

function StatusBadge({ status, orgao }: { status?: string; orgao?: string }) {
  const label = status ?? "Status indisponível";
  const short = label.length > 30 ? label.slice(0, 28) + "…" : label;
  return (
    <span
      title={label}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold text-center ${statusStyle(status)}`}
    >
      {short}
      {orgao && <span className="ml-1 opacity-60">· {orgao}</span>}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function LeisPage() {
  const [tab, setTab] = useState<Tab>("proposicoes");

  // Proposições
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([]);
  const [statusProp, setStatusProp] = useState<ApiStatus>("idle");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [tipo, setTipo] = useState("");
  const [itens, setItens] = useState(20);

  // Votações
  const now = new Date();
  const [votacoes, setVotacoes] = useState<Votacao[]>([]);
  const [statusVot, setStatusVot] = useState<ApiStatus>("idle");
  const [votMes, setVotMes] = useState(now.getMonth() + 1);
  const [votAno, setVotAno] = useState(now.getFullYear());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);


  // Ref to avoid stale closure in setInterval
  const votParamsRef = useRef({ mes: votMes, ano: votAno });
  useEffect(() => { votParamsRef.current = { mes: votMes, ano: votAno }; }, [votMes, votAno]);

  function loadProposicoes() {
    setStatusProp("loading");
    api.camara.proposicoes(ano, tipo, itens)
      .then((d) => {
        const sorted = [...d].sort((a, b) =>
          new Date(b.data_apresentacao ?? 0).getTime() - new Date(a.data_apresentacao ?? 0).getTime()
        );
        setProposicoes(sorted);
        setStatusProp("success");
      })
      .catch((e: Error) => setStatusProp(e.message === "offline" ? "offline" : "error"));
  }

  function loadVotacoes(mes = votMes, ano = votAno, silent = false) {
    if (!silent) setStatusVot("loading");
    setRefreshing(true);
    api.camara.votacoes(100, buildDataInicio(mes, ano))
      .then((d) => {
        setVotacoes(d);
        setStatusVot("success");
        setLastUpdated(new Date());
        setRefreshing(false);
      })
      .catch((e: Error) => {
        setStatusVot(e.message === "offline" ? "offline" : "error");
        setRefreshing(false);
      });
  }

  useEffect(loadProposicoes, [ano, tipo, itens]);

  // Auto-refresh every 2 minutes when on votacoes tab
  useEffect(() => {
    if (tab !== "votacoes") return;
    loadVotacoes(votMes, votAno);
    const timer = setInterval(() => {
      loadVotacoes(votParamsRef.current.mes, votParamsRef.current.ano, true);
    }, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [tab, votMes, votAno]);

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

  // Para o ano atual mostra só até o mês corrente; anos passados mostram todos
  const availableMonths = votAno === currentYear
    ? MESES.slice(0, currentMonth)
    : MESES;

  function handleVotAnoChange(novoAno: number) {
    setVotAno(novoAno);
    // Se trocou para o ano atual e o mês selecionado ainda não chegou, volta para o mês atual
    if (novoAno === currentYear && votMes > currentMonth) {
      setVotMes(currentMonth);
    }
  }

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-bold text-slate-900">Leis e votos</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Acompanhe os projetos de{" "}
            <span className="font-medium text-blue-600">lei</span> e suas{" "}
            <span className="font-medium text-blue-600">votações</span>
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-5 flex gap-4 border-b border-slate-200">
          {(["proposicoes", "votacoes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "proposicoes" ? "Proposições" : "Votações recentes"}
            </button>
          ))}
        </div>

        {/* ── PROPOSIÇÕES ── */}
        {tab === "proposicoes" && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
              className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                </svg>
                Filtros
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:outline-none">
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select value={ano} onChange={(e) => setAno(Number(e.target.value))}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:outline-none">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={itens} onChange={(e) => setItens(Number(e.target.value))}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:outline-none">
                  {[20, 50, 100].map((n) => <option key={n} value={n}>{n} por página</option>)}
                </select>
              </div>
            </motion.div>

            {statusProp === "loading" && <LoadingSpinner message="Carregando proposições..." count={4} />}
            {(statusProp === "offline" || statusProp === "error") && (
              <OfflineBanner source="API da Câmara" onRetry={loadProposicoes} />
            )}

            {statusProp === "success" && (
              <>
                <p className="mb-3 text-xs text-slate-400">{proposicoes.length} projeto(s) encontrado(s)</p>
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                  {proposicoes.length === 0 && (
                    <p className="py-10 text-center text-sm text-slate-400">
                      Nenhuma proposição para {tipo || "todas as categorias"} em {ano}.
                    </p>
                  )}
                  {proposicoes.map((p) => (
                    <motion.div key={p.id} variants={slideInLeft} whileHover={cardHover}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <SiglaTooltip sigla={p.sigla_tipo} />
                            <span className="text-xs text-slate-400">{fmtDate(p.data_apresentacao)}</span>
                          </div>
                          <h3 className="font-semibold text-slate-900">
                            {p.sigla_tipo} {p.numero}/{p.ano}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500 leading-relaxed line-clamp-2">{p.ementa}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <StatusBadge status={p.descricao_situacao} orgao={p.orgao_situacao} />
                          {p.url_inteiro_teor && (
                            <a href={p.url_inteiro_teor} target="_blank" rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline">
                              Ver texto
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          </>
        )}

        {/* ── VOTAÇÕES RECENTES ── */}
        {tab === "votacoes" && (
          <>
            {/* Filtros + refresh */}
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
              className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                  </svg>
                  Filtros
                </div>

                <select
                  value={votMes}
                  onChange={(e) => setVotMes(Number(e.target.value))}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:outline-none"
                >
                  {availableMonths.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>

                <select
                  value={votAno}
                  onChange={(e) => handleVotAnoChange(Number(e.target.value))}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:outline-none"
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>

                <button
                  onClick={() => loadVotacoes()}
                  disabled={refreshing}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                >
                  <svg
                    className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Atualizar
                </button>

                {lastUpdated && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Atualizado às {fmtTime(lastUpdated)} — auto-refresh a cada 15 min
                  </span>
                )}
              </div>
            </motion.div>

            {statusVot === "loading" && <LoadingSpinner message="Carregando votações..." count={4} />}
            {(statusVot === "offline" || statusVot === "error") && (
              <OfflineBanner source="API da Câmara" onRetry={() => loadVotacoes()} />
            )}

            {statusVot === "success" && (
              <>
                <p className="mb-3 text-xs text-slate-400">
                  {votacoes.length} votação(ões) em {MESES[votMes - 1]} {votAno} — clique em um card para ver o voto de cada partido
                </p>
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                  {votacoes.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-sm font-medium text-slate-500">
                        {votMes === currentMonth && votAno === currentYear
                          ? "Nenhuma lei foi adicionada recentemente."
                          : `Nenhuma votação encontrada para ${MESES[votMes - 1]} ${votAno}.`}
                      </p>
                      {votMes === currentMonth && votAno === currentYear && (
                        <p className="mt-1 text-xs text-slate-400">
                          A página atualiza automaticamente a cada 15 minutos.
                        </p>
                      )}
                    </div>
                  )}
                  {votacoes.map((v) => (
                    <VotacaoCard key={v.id} v={v} />
                  ))}
                </motion.div>
              </>
            )}
          </>
        )}
      </main>
    </PageTransition>
  );
}
