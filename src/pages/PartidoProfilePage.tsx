import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { api } from "../services/api";
import type { ApiStatus, Deputado, Partido, PartidoGastos, PartidoLideranca, PartidoLiderInfo, PartidoVotacoesStats } from "../types";

const SIGLA_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  PT:            { bg: "bg-red-500",    text: "text-white", ring: "ring-red-200" },
  PL:            { bg: "bg-blue-500",   text: "text-white", ring: "ring-blue-200" },
  MDB:           { bg: "bg-green-500",  text: "text-white", ring: "ring-green-200" },
  UNIÃO:         { bg: "bg-slate-700",  text: "text-white", ring: "ring-slate-300" },
  PSD:           { bg: "bg-slate-500",  text: "text-white", ring: "ring-slate-200" },
  PSB:           { bg: "bg-pink-500",   text: "text-white", ring: "ring-pink-200" },
  PDT:           { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-200" },
  PSOL:          { bg: "bg-rose-500",   text: "text-white", ring: "ring-rose-200" },
  REPUBLICANOS:  { bg: "bg-violet-600", text: "text-white", ring: "ring-violet-200" },
  PP:            { bg: "bg-yellow-500", text: "text-white", ring: "ring-yellow-200" },
  PODE:          { bg: "bg-sky-500",    text: "text-white", ring: "ring-sky-200" },
  AVANTE:        { bg: "bg-teal-500",   text: "text-white", ring: "ring-teal-200" },
  SOLIDARIEDADE: { bg: "bg-amber-500",  text: "text-white", ring: "ring-amber-200" },
  PV:            { bg: "bg-lime-600",   text: "text-white", ring: "ring-lime-200" },
  CIDADANIA:     { bg: "bg-cyan-600",   text: "text-white", ring: "ring-cyan-200" },
  PATRIOTA:      { bg: "bg-emerald-600",text: "text-white", ring: "ring-emerald-200" },
  AGIR:          { bg: "bg-indigo-500", text: "text-white", ring: "ring-indigo-200" },
};

function getColor(sigla: string) {
  return SIGLA_COLORS[sigla] ?? { bg: "bg-blue-400", text: "text-white", ring: "ring-blue-200" };
}

function initials(sigla: string) {
  return sigla.length <= 2 ? sigla : sigla.slice(0, 2);
}

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function deputadoIdFromUri(uri?: string): number | null {
  if (!uri) return null;
  const m = uri.match(/\/deputados\/(\d+)/);
  return m ? Number(m[1]) : null;
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-800">{title}</span>
      {badge}
    </div>
  );
}

// ── Column chart ──────────────────────────────────────────────────────────────

function DonutChart({ sim, nao, abstencao }: { sim: number; nao: number; abstencao: number }) {
  const total = sim + nao + abstencao;
  if (total === 0) return <p className="text-sm text-slate-400">Sem dados de votação</p>;

  const max = Math.max(sim, nao, abstencao, 1);
  const BAR_H = 140;

  const bars = [
    { label: "Sim",       count: sim,       bg: "bg-green-400", text: "text-green-600", light: "bg-green-50",  border: "border-green-200" },
    { label: "Não",       count: nao,       bg: "bg-red-400",   text: "text-red-500",   light: "bg-red-50",    border: "border-red-200"   },
    { label: "Abstenção", count: abstencao, bg: "bg-slate-300", text: "text-slate-500", light: "bg-slate-50",  border: "border-slate-200" },
  ];

  const taxaAprov = Math.round((sim / total) * 100);

  return (
    <div className="space-y-5">
      {/* Gráfico de colunas */}
      <div className="flex items-end justify-around gap-4 px-4">
        {bars.map((b, i) => {
          const h = Math.max(6, Math.round((b.count / max) * BAR_H));
          const pct = ((b.count / total) * 100).toFixed(1);
          return (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
              {/* Contador acima */}
              <motion.span
                className={`text-2xl font-extrabold ${b.text}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                {b.count}
              </motion.span>

              {/* Barra */}
              <div className="relative w-full" style={{ height: BAR_H }}>
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 rounded-t-2xl ${b.bg}`}
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ duration: 0.65, delay: i * 0.1, ease: [0.34, 1.1, 0.64, 1] }}
                />
              </div>

              {/* Label */}
              <span className="text-sm font-bold text-slate-700">{b.label}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${b.light} ${b.border} ${b.text}`}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Linha de resumo */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
        <span><span className="font-bold text-slate-700">{total}</span> votos totais neste período</span>
        <span className="font-semibold text-green-600">{taxaAprov}% de aprovação</span>
      </div>
    </div>
  );
}

// ── Votação row ───────────────────────────────────────────────────────────────

function cleanDesc(desc: string): string {
  // Remove "Sim: 87; Não: 301; Total: 388." appended by the API
  return desc.replace(/\s*Sim:\s*\d+;\s*N[ãa]o:\s*\d+;(\s*Absten[çc][ãa]o:\s*\d+;)?\s*Total:\s*\d+\.?/gi, "").trim();
}

function resultadoDesc(desc: string): { label: string; cls: string; border: string } {
  const d = desc.toLowerCase().trim();
  if (d.startsWith("aprovad")) return { label: "Aprovado",   cls: "bg-green-100 text-green-700", border: "border-l-green-400" };
  if (d.startsWith("rejeitad")) return { label: "Rejeitado", cls: "bg-red-100 text-red-600",     border: "border-l-red-400"   };
  if (d.startsWith("mantido")) return  { label: "Mantido",   cls: "bg-amber-100 text-amber-700", border: "border-l-amber-400" };
  return { label: "Votação", cls: "bg-slate-100 text-slate-500", border: "border-l-slate-300" };
}

function VotacaoRow({ v }: { v: PartidoVotacoesStats["votacoes"][0] }) {
  const total = v.sim + v.nao + v.abstencao;
  const desc = cleanDesc(v.descricao || "");
  const { label, cls, border } = resultadoDesc(v.descricao || "");

  return (
    <div className={`rounded-xl border border-slate-100 bg-white border-l-4 ${border} px-4 py-3 shadow-sm`}>
      {/* Top row */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>{label}</span>
        <span className="text-[11px] text-slate-400">{fmtDate(v.data)}</span>
      </div>

      {/* Description */}
      <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-relaxed">
        {desc || "—"}
      </p>

      {/* Mini stacked bar */}
      {total > 0 && (
        <div className="mt-3">
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
            {v.sim > 0 && (
              <motion.div
                className="h-full bg-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${(v.sim / total) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            )}
            {v.nao > 0 && (
              <motion.div
                className="h-full bg-red-400"
                initial={{ width: 0 }}
                animate={{ width: `${(v.nao / total) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              />
            )}
            {v.abstencao > 0 && (
              <motion.div
                className="h-full bg-slate-300"
                initial={{ width: 0 }}
                animate={{ width: `${(v.abstencao / total) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              />
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />{v.sim} sim
            </span>
            <span className="flex items-center gap-1 font-semibold text-red-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />{v.nao} não
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />{v.abstencao} abst.
            </span>
            <span className="ml-auto text-slate-300">{total} membro{total !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bar chart (expenses) ──────────────────────────────────────────────────────

function BarChart({ gastos, accentBg }: { gastos: PartidoGastos; accentBg: string }) {
  const max = gastos.categorias[0]?.valor ?? 1;
  return (
    <div className="space-y-3">
      {gastos.categorias.map((cat) => (
        <div key={cat.categoria}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-600" title={cat.categoria}>{cat.categoria}</span>
            <span className="flex-shrink-0 font-semibold text-slate-700">{fmtBRL(cat.valor)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(cat.valor / max) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${accentBg}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-2/3 rounded bg-slate-100" />
      <div className="h-4 w-1/2 rounded bg-slate-100" />
      <div className="h-4 w-3/4 rounded bg-slate-100" />
    </div>
  );
}

// ── Líder card ────────────────────────────────────────────────────────────────

function fmtPageviews(pv?: number): string | null {
  if (pv == null) return null;
  return pv >= 1000 ? `${(pv / 1000).toFixed(1)}k views/6m` : `${pv} views/6m`;
}

function LiderCard({
  role, lider, bg, text, linkId, wikiUrl,
}: {
  role: string;
  lider: PartidoLiderInfo | null;
  bg: string;
  text: string;
  linkId?: number | null;
  wikiUrl?: string | null;
}) {
  const photo = lider?.urlFotoWiki || lider?.urlFoto;
  const pvLabel = fmtPageviews(lider?.pageviews);

  const inner = (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 h-full text-center">
      {photo ? (
        <img src={photo} alt={lider?.nome ?? ""}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-md"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <div className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold shadow-md ${bg} ${text}`}>
          {(lider?.nome ?? "?")[0]}
        </div>
      )}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{role}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800 leading-snug">{lider?.nome ?? "—"}</p>
        {lider?.uf && <p className="text-xs text-slate-500">{lider.uf}</p>}
      </div>
      {pvLabel && (
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
          {pvLabel}
        </span>
      )}
      {!lider && <p className="text-xs text-slate-400 italic">Não disponível</p>}
    </div>
  );

  // Internal routes take priority over external links
  if (lider?.codigoSenador) {
    return (
      <Link to={`/politicos/senador/${lider.codigoSenador}`} className="group block transition hover:scale-[1.02]">
        {inner}
      </Link>
    );
  }
  if (lider?.idDeputado) {
    return (
      <Link to={`/politicos/deputado/${lider.idDeputado}`} className="group block transition hover:scale-[1.02]">
        {inner}
      </Link>
    );
  }
  if (linkId) {
    return (
      <Link to={`/politicos/deputado/${linkId}`} className="group block transition hover:scale-[1.02]">
        {inner}
      </Link>
    );
  }
  if (wikiUrl) {
    return (
      <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="group block transition hover:scale-[1.02]">
        {inner}
      </a>
    );
  }
  return inner;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PartidoProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [partido, setPartido] = useState<Partido | null>(null);
  const [statusPartido, setStatusPartido] = useState<ApiStatus>("loading");

  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [statusDep, setStatusDep] = useState<ApiStatus>("loading");

  const [votStats, setVotStats] = useState<PartidoVotacoesStats | null>(null);
  const [statusVot, setStatusVot] = useState<ApiStatus>("loading");

  const [gastos, setGastos] = useState<PartidoGastos | null>(null);
  const [statusGastos, setStatusGastos] = useState<ApiStatus>("loading");

  const [lideranca, setLideranca] = useState<PartidoLideranca | null>(null);
  const [statusLideranca, setStatusLideranca] = useState<ApiStatus>("loading");

  useEffect(() => {
    if (!id) return;
    const nid = Number(id);
    let cancelled = false;

    setStatusPartido("loading");
    api.camara.partidoById(nid)
      .then((p) => { if (!cancelled) { setPartido(p); setStatusPartido("success"); } })
      .catch((e: Error) => { if (!cancelled) setStatusPartido(e.message === "offline" ? "offline" : "error"); });

    setStatusDep("loading");
    api.camara.deputados()
      .then((all) => { if (!cancelled) { setDeputados(all); setStatusDep("success"); } })
      .catch(() => { if (!cancelled) setStatusDep("error"); });

    setStatusVot("loading");
    api.camara.partidoVotacoesStats(nid)
      .then((s) => { if (!cancelled) { setVotStats(s); setStatusVot("success"); } })
      .catch(() => { if (!cancelled) setStatusVot("error"); });

    const votRefresh = setInterval(() => {
      api.camara.partidoVotacoesStats(nid)
        .then((s) => { if (!cancelled) { setVotStats(s); setStatusVot("success"); } })
        .catch(() => {});
    }, 15 * 60 * 1000);

    setStatusGastos("loading");
    api.camara.partidoGastos(nid)
      .then((g) => { if (!cancelled) { setGastos(g); setStatusGastos("success"); } })
      .catch(() => { if (!cancelled) setStatusGastos("error"); });

    setStatusLideranca("loading");
    api.camara.partidoLideranca(nid)
      .then((l) => { if (!cancelled) { setLideranca(l); setStatusLideranca("success"); } })
      .catch(() => { if (!cancelled) setStatusLideranca("error"); });

    return () => { cancelled = true; clearInterval(votRefresh); };
  }, [id]);

  const membros = partido
    ? deputados.filter((d) => d.sigla_partido === partido.sigla)
    : [];

  const { bg, text, ring } = getColor(partido?.sigla ?? "");
  const liderCamaraId = lideranca?.lider_camara?.uri
    ? deputadoIdFromUri(lideranca.lider_camara.uri)
    : partido?.lider?.uri ? deputadoIdFromUri(partido.lider.uri) : null;

  if (statusPartido === "loading") {
    return (
      <PageTransition direction="up">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingSpinner message="Carregando partido..." count={3} />
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

        {(statusPartido === "offline" || statusPartido === "error") && (
          <OfflineBanner source="API da Câmara" onRetry={() => {
            if (!id) return;
            setStatusPartido("loading");
            api.camara.partidoById(Number(id))
              .then((p) => { setPartido(p); setStatusPartido("success"); })
              .catch((e: Error) => setStatusPartido(e.message === "offline" ? "offline" : "error"));
          }} />
        )}

        {partido && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }} className="space-y-5">

            {/* ── CABEÇALHO ── */}
            <SectionCard>
              <div className={`h-2 rounded-t-2xl ${bg}`} />
              <div className="p-6">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                  <div className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-md ring-4 ${ring}`}>
                    {partido.urlLogo ? (
                      <img src={partido.urlLogo} alt={partido.sigla} className="h-20 w-20 object-contain"
                        onError={(e) => {
                          const el = e.currentTarget.parentElement!;
                          e.currentTarget.remove();
                          el.className = `flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-bold ${bg} ${text}`;
                          el.textContent = initials(partido.sigla);
                        }} />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center rounded-2xl text-2xl font-bold ${bg} ${text}`}>
                        {initials(partido.sigla)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-slate-900">{partido.sigla}</h1>
                    <p className="mt-0.5 text-sm text-slate-500">{partido.nome}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      {partido.situacao && (
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          partido.situacao === "Ativo"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}>{partido.situacao}</span>
                      )}
                      {partido.urlWebSite && (
                        <a href={partido.urlWebSite} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          Site oficial
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── STATS ── */}
            {/* "totalPosse" (Câmara) não é "cadeiras atuais" apesar do nome —
                é quanta gente já tomou posse pela legenda nesta legislatura,
                inflado pelo mesmo efeito de troca de partido que já achamos
                em get_deputados (ex: PDT mostrava 9 membros e 16 "cadeiras em
                exercício" ao mesmo tempo, sem como reconciliar). Removido até
                termos uma explicação verificada pra mostrar com confiança. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <SectionCard className="p-5 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Membros na Câmara</p>
                <p className={`mt-2 text-4xl font-bold ${bg.replace("bg-", "text-")}`}>
                  {partido.totalMembros ?? "—"}
                </p>
                <p className="mt-1 text-xs text-slate-400">57ª Legislatura</p>
              </SectionCard>
              <SectionCard className="p-5 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Representatividade</p>
                <p className={`mt-2 text-4xl font-bold ${bg.replace("bg-", "text-")}`}>
                  {partido.totalMembros != null ? `${((partido.totalMembros / 513) * 100).toFixed(1)}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-400">das cadeiras</p>
              </SectionCard>
            </div>

            {/* ── LIDERANÇA ── */}
            <SectionCard className="p-5">
              <SectionHeader
                icon={
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
                title="Liderança do Partido"
              />

              {statusLideranca === "loading" && <StatsSkeleton />}
              {statusLideranca === "error" && <p className="text-sm text-slate-400">Não foi possível carregar a liderança.</p>}
              {statusLideranca === "success" && lideranca && (() => {
                const mesma = lideranca.lider_camara && lideranca.presidente &&
                  lideranca.lider_camara.nome === lideranca.presidente.nome;
                if (mesma) {
                  return (
                    <div className="flex justify-center">
                      <div className="w-48">
                        <LiderCard
                          role="Líder na Câmara e Presidente"
                          lider={lideranca.lider_camara}
                          bg={bg}
                          text={text}
                          linkId={liderCamaraId}
                        />
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <LiderCard
                      role="Líder na Câmara"
                      lider={lideranca.lider_camara}
                      bg={bg}
                      text={text}
                      linkId={liderCamaraId}
                    />
                    <LiderCard
                      role="Presidente do Partido"
                      lider={lideranca.presidente}
                      bg={bg}
                      text={text}
                      wikiUrl={lideranca.presidente?.urlWiki}
                    />
                  </div>
                );
              })()}
            </SectionCard>

            {/* ── VOTAÇÕES DA BANCADA ── */}
            <SectionCard className="p-5">
              <SectionHeader
                icon={
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
                title="Votações da Bancada"
                badge={<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">plenário — últimos 6 meses</span>}
              />

              {statusVot === "loading" && <StatsSkeleton />}
              {statusVot === "error" && <p className="text-sm text-slate-400">Não foi possível carregar as votações.</p>}
              {statusVot === "success" && votStats && (
                <div className="space-y-5">
                  {votStats.votacoes_merito_count > 0 ? (
                    <div>
                      <DonutChart sim={votStats.total_sim} nao={votStats.total_nao} abstencao={votStats.total_abstencao} />
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                        Baseado em {votStats.votacoes_merito_count} votaç{votStats.votacoes_merito_count === 1 ? "ão" : "ões"} de mérito nos últimos 6 meses
                        {votStats.votacoes_procedural_count > 0 && ` (mais ${votStats.votacoes_procedural_count} despacho${votStats.votacoes_procedural_count !== 1 ? "s" : ""}/procedural${votStats.votacoes_procedural_count !== 1 ? "is" : ""} excluído${votStats.votacoes_procedural_count !== 1 ? "s" : ""} do cálculo)`}
                        {votStats.votacoes_merito_count < 5 && " — amostra pequena, um único resultado pode dominar o percentual."}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Nenhuma votação de mérito com voto individual da bancada nos últimos 6 meses — sem base para calcular uma taxa de aprovação confiável.
                    </p>
                  )}

                  {votStats.votacoes.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Últimas votações participadas</p>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {votStats.votacoes.map((v) => <VotacaoRow key={v.id} v={v} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ── GASTOS DO PARTIDO ── */}
            <SectionCard className="p-5">
              <SectionHeader
                icon={
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                }
                title="Gastos da Bancada"
                badge={<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">CEAP {gastos?.ano ?? new Date().getFullYear()}</span>}
              />

              {statusGastos === "loading" && <StatsSkeleton />}
              {statusGastos === "error" && <p className="text-sm text-slate-400">Não foi possível carregar os gastos.</p>}
              {statusGastos === "success" && gastos && (
                gastos.despesas_indisponivel ? (
                  <p className="text-sm text-slate-400">
                    Dado indisponível no momento — a fonte oficial (Câmara dos Deputados) não retornou registros de despesas para a bancada.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex items-baseline gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <span className="text-xs text-slate-500">Total em {gastos.ano ?? new Date().getFullYear()}:</span>
                      <span className={`text-2xl font-bold ${bg.replace("bg-", "text-")}`}>{fmtBRL(gastos.total)}</span>
                    </div>
                    {gastos.categorias.length > 0 ? (
                      <BarChart gastos={gastos} accentBg={bg} />
                    ) : (
                      <p className="text-sm text-slate-400">Nenhum gasto registrado.</p>
                    )}
                  </div>
                )
              )}
            </SectionCard>

            {/* ── DEPUTADOS FEDERAIS DO PARTIDO ── */}
            <SectionCard className="p-5">
              <SectionHeader
                icon={
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                }
                title="Deputados Federais"
                badge={membros.length > 0 ? (
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${bg} ${text}`}>{membros.length}</span>
                ) : undefined}
              />

              {statusDep === "loading" && (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Carregando deputados...
                </div>
              )}

              {statusDep === "success" && membros.length === 0 && (
                <p className="py-4 text-sm text-slate-400">Nenhum deputado federal encontrado para este partido.</p>
              )}

              {statusDep === "success" && membros.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {membros.map((d) => (
                    <Link key={d.id} to={`/politicos/deputado/${d.id}`}
                      className="group flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 transition hover:bg-slate-100">
                      {d.url_foto ? (
                        <img src={d.url_foto} alt={d.nome}
                          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${bg} ${text}`}>
                          {d.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-slate-900">{d.nome}</p>
                        <p className="text-[10px] text-slate-400">{d.sigla_uf}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

          </motion.div>
        )}
      </main>
    </PageTransition>
  );
}
