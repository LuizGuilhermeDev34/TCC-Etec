import { useEffect, useRef, useState } from "react";
import { Link, useNavigationType } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { OfflineBanner } from "../components/OfflineBanner";
import { api, classifyApiError } from "../services/api";
import { containerVariants, slideInLeft, cardHover } from "../animations";
import type { ApiStatus, Deputado, Senador } from "../types";

type Tab = "deputados" | "senadores";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

const PARTY_COLORS: Record<string, string> = {
  PT: "bg-red-100 text-red-700",
  PL: "bg-blue-100 text-blue-700",
  MDB: "bg-green-100 text-green-700",
  UNIÃO: "bg-slate-200 text-slate-700",
  PSD: "bg-purple-100 text-purple-700",
  PSB: "bg-pink-100 text-pink-700",
  PDT: "bg-orange-100 text-orange-700",
  PSOL: "bg-rose-100 text-rose-700",
  REPUBLICANOS: "bg-violet-100 text-violet-700",
  PP: "bg-yellow-100 text-yellow-700",
  PODE: "bg-sky-100 text-sky-700",
  PODEMOS: "bg-sky-100 text-sky-700",
  AVANTE: "bg-teal-100 text-teal-700",
  SOLIDARIEDADE: "bg-amber-100 text-amber-700",
  PATRIOTA: "bg-emerald-100 text-emerald-700",
  PV: "bg-lime-100 text-lime-700",
  DC: "bg-cyan-100 text-cyan-700",
  PSDB: "bg-blue-100 text-blue-700",
  CIDADANIA: "bg-indigo-100 text-indigo-700",
};

function partyColor(sigla: string) {
  return PARTY_COLORS[sigla.toUpperCase()] ?? "bg-slate-100 text-slate-600";
}

function DeputadoCard({ d }: { d: Deputado }) {
  return (
    <motion.div variants={slideInLeft} whileHover={cardHover}>
      <Link
        to={`/politicos/deputado/${d.id}`}
        className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors"
      >
        <div className="flex items-start gap-3">
          {d.url_foto ? (
            <img
              src={d.url_foto}
              alt={d.nome}
              className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-2 ring-slate-100"
              onError={(e) => { (e.target as HTMLImageElement).className = "hidden"; }}
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{d.nome}</p>
            <p className="text-xs text-slate-500">Deputado Federal</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${partyColor(d.sigla_partido)}`}>
                {d.sigla_partido}
              </span>
              <span className="text-xs text-slate-400">{d.sigla_uf}</span>
            </div>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 self-center text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <span>Legislatura <span className="font-semibold text-slate-700">{d.id_legislatura}</span></span>
          <span className="text-blue-500 font-medium">Ver perfil →</span>
        </div>
      </Link>
    </motion.div>
  );
}

function SenadorCard({ s }: { s: Senador }) {
  return (
    <motion.div variants={slideInLeft} whileHover={cardHover}>
      <Link
        to={`/politicos/senador/${s.codigo}`}
        className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors"
      >
        <div className="flex items-start gap-3">
          {s.url_foto ? (
            <img
              src={s.url_foto}
              alt={s.nome}
              className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-2 ring-slate-100"
              onError={(e) => { (e.target as HTMLImageElement).className = "hidden"; }}
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{s.nome}</p>
            <p className="text-xs text-slate-500">Senad{s.sexo === "Feminino" ? "ora" : "or"}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${partyColor(s.partido)}`}>
                {s.partido}
              </span>
              <span className="text-xs text-slate-400">{s.uf}</span>
            </div>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 self-center text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <span>Senado Federal</span>
          <span className="text-blue-500 font-medium">Ver perfil →</span>
        </div>
      </Link>
    </motion.div>
  );
}

export function PoliticosPage() {
  const navigationType = useNavigationType();

  const [tab, setTab_] = useState<Tab>(() =>
    (sessionStorage.getItem("politicos_tab") as Tab | null) ?? "deputados"
  );
  const [query, setQuery_] = useState<string>(() =>
    sessionStorage.getItem("politicos_query") ?? ""
  );

  function setTab(t: Tab) {
    sessionStorage.setItem("politicos_tab", t);
    sessionStorage.removeItem("politicos_query");
    setTab_(t);
    setQuery_("");
  }
  function setQuery(q: string) {
    if (q) sessionStorage.setItem("politicos_query", q);
    else sessionStorage.removeItem("politicos_query");
    setQuery_(q);
  }

  const [uf, setUf_] = useState<string>(() => sessionStorage.getItem("politicos_uf") ?? "SP");
  function setUf(u: string) {
    sessionStorage.setItem("politicos_uf", u);
    setUf_(u);
  }

  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [senadores, setSenadores] = useState<Senador[]>([]);
  const [statusDep, setStatusDep] = useState<ApiStatus>("idle");
  const [statusSen, setStatusSen] = useState<ApiStatus>("idle");

  // Guarda o Y a restaurar; aplicado só depois que a lista carregar
  const pendingScroll = useRef<number | null>(null);

  useEffect(() => {
    if (navigationType === "POP") {
      const y = sessionStorage.getItem("politicos_scroll");
      if (y) pendingScroll.current = parseInt(y);
    }
    return () => { sessionStorage.setItem("politicos_scroll", String(window.scrollY)); };
  }, [navigationType]);

  // Dispara quando a aba ativa termina de carregar
  const activeStatus = tab === "deputados" ? statusDep : statusSen;
  useEffect(() => {
    if (activeStatus === "success" && pendingScroll.current !== null) {
      const y = pendingScroll.current;
      pendingScroll.current = null;
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [activeStatus]);

  function loadDeputados() {
    setStatusDep("loading");
    api.camara.deputados(57, uf).then((d) => { setDeputados(d); setStatusDep("success"); })
      .catch((e: Error) => setStatusDep(classifyApiError(e)));
  }
  useEffect(loadDeputados, [uf]);

  function loadSenadores() {
    setStatusSen("loading");
    api.senado.senadores().then((d) => { setSenadores(d); setStatusSen("success"); })
      .catch((e: Error) => setStatusSen(classifyApiError(e)));
  }
  useEffect(() => {
    if (tab !== "senadores" || senadores.length > 0) return;
    let cancelled = false;
    setStatusSen("loading");
    api.senado.senadores().then((d) => { if (!cancelled) { setSenadores(d); setStatusSen("success"); } })
      .catch((e: Error) => { if (!cancelled) setStatusSen(classifyApiError(e)); });
    return () => { cancelled = true; };
  }, [tab, senadores.length]);

  const q = query.toLowerCase();
  const filteredDep = deputados.filter(
    (d) => d.nome.toLowerCase().includes(q) || d.sigla_partido.toLowerCase().includes(q),
  );
  const filteredSen = senadores.filter(
    (s) => s.nome.toLowerCase().includes(q) || s.partido.toLowerCase().includes(q) || s.uf.toLowerCase().includes(q),
  );

  const activeCount = tab === "deputados" ? filteredDep.length : filteredSen.length;

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="mb-1 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Políticos</h1>
            <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Comparador
            </button>
          </div>
          <p className="mb-5 text-sm text-slate-500">
            Explore informações sobre{" "}
            <span className="font-medium text-blue-600">deputados federais</span> e{" "}
            <span className="font-medium text-blue-600">senadores</span>
          </p>
        </motion.div>

        {/* Busca */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        >
          <div className="relative flex-1">
            <svg className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder="Buscar por nome ou partido..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          {tab === "deputados" && (
            <select
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="">Todos os estados</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-4">
            {(["deputados", "senadores"] as Tab[]).map((t) => {
              const labels: Record<Tab, string> = {
                deputados: `Dep. Federais ${uf}${filteredDep.length > 0 ? ` (${filteredDep.length})` : ""}`,
                senadores: `Senadores${senadores.length > 0 ? ` (${senadores.length})` : ""}`,
              };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                    tab === t
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
          {activeStatus === "success" && (
            <p className="text-xs text-slate-400">{activeCount} encontrado(s)</p>
          )}
        </div>

        {activeStatus === "loading" && <LoadingSpinner message={`Carregando...`} />}
        {(activeStatus === "offline" || activeStatus === "error" || activeStatus === "rate_limited") && (
          <OfflineBanner
            source={tab === "deputados" ? "API da Câmara" : "API do Senado"}
            kind={activeStatus === "rate_limited" ? "rate_limited" : "offline"}
            onRetry={tab === "deputados" ? loadDeputados : loadSenadores}
          />
        )}

        {activeStatus === "success" && (
          <motion.div
            key={tab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tab === "deputados" && filteredDep.map((d) => <DeputadoCard key={d.id} d={d} />)}
            {tab === "senadores" && filteredSen.map((s) => <SenadorCard key={s.codigo} s={s} />)}
            {activeCount === 0 && query && (
              <p className="col-span-3 py-10 text-center text-sm text-slate-400">
                Nenhum resultado para "{query}"
              </p>
            )}
          </motion.div>
        )}
      </main>
    </PageTransition>
  );
}
