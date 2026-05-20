import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "../components/PageTransition";
import { OfflineBanner } from "../components/OfflineBanner";
import { api } from "../services/api";
import type { Activity, ApiStatus, Deputado } from "../types";

interface Stats { deputados: number; senadores: number; partidos: number; }

// ── Hero ──────────────────────────────────────────────────────────────────────

// ── Texto rotativo de stats ───────────────────────────────────────────────────

const FRASES = [
  { destaque: "594 políticos",    resto: " cadastrados e monitorados"     },
  { destaque: "21 partidos",      resto: " políticos acompanhados"         },
  { destaque: "Votações",         resto: " do plenário em tempo real"      },
  { destaque: "Patrimônio",       resto: " declarado de cada mandatário"   },
  { destaque: "Transparência",    resto: " que o brasileiro merece"        },
];

function CyclingText() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FRASES.length), 3200);
    return () => clearInterval(t);
  }, []);
  const f = FRASES[idx];
  return (
    <div className="h-12 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -28 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="text-lg font-semibold sm:text-xl"
        >
          <span className="text-blue-300">{f.destaque}</span>
          <span className="text-white/80">{f.resto}</span>
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ── Roleta de fotos ───────────────────────────────────────────────────────────

function PoliticoCarousel({ deputados }: { deputados: Deputado[] }) {
  const comFoto = deputados.filter((d) => d.url_foto).slice(0, 30);
  if (comFoto.length < 6) return null;
  const row1 = [...comFoto.slice(0, 15), ...comFoto.slice(0, 15)];
  const row2 = [...comFoto.slice(15), ...comFoto.slice(15)];

  return (
    <>
      <style>{`
        @keyframes scrollL { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes scrollR { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        .scroll-l { animation: scrollL 28s linear infinite; }
        .scroll-r { animation: scrollR 34s linear infinite; }
      `}</style>
      <div className="flex flex-col gap-3 overflow-hidden">
        {/* Linha 1 — esquerda */}
        <div className="flex gap-3 scroll-l">
          {row1.map((d, i) => (
            <Link key={`r1-${d.id}-${i}`} to={`/politicos/deputado/${d.id}`} className="flex-shrink-0 group">
              <img
                src={d.url_foto}
                alt={d.nome}
                title={d.nome}
                className="h-14 w-14 rounded-full object-cover border-2 border-white/20 shadow-md transition group-hover:border-blue-400 group-hover:scale-110"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </Link>
          ))}
        </div>
        {/* Linha 2 — direita */}
        <div className="flex gap-3 scroll-r">
          {row2.map((d, i) => (
            <Link key={`r2-${d.id}-${i}`} to={`/politicos/deputado/${d.id}`} className="flex-shrink-0 group">
              <img
                src={d.url_foto}
                alt={d.nome}
                title={d.nome}
                className="h-14 w-14 rounded-full object-cover border-2 border-white/20 shadow-md transition group-hover:border-blue-400 group-hover:scale-110"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero({ deputados }: { deputados: Deputado[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-8 py-12 mb-6 shadow-xl">
      {/* dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />
      {/* glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-blue-500 opacity-10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-indigo-600 opacity-10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">

        {/* Lado esquerdo — texto */}
        <div>
          <div className="mb-5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-green-400">Dados em tempo real</span>
          </div>

          <h1 className="mb-3 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Democratização<br />de Dados
          </h1>

          <CyclingText />

          <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
            <p className="text-sm leading-relaxed text-slate-300">
              Acreditamos que <span className="font-semibold text-white">transparência não é um privilégio</span> — é um direito de cada brasileiro. Aqui você encontra dados públicos apresentados de forma clara, sem partido, sem agenda.
            </p>
            <p className="text-sm leading-relaxed text-slate-400">
              Dados direto das APIs oficiais da Câmara dos Deputados, Senado Federal e TSE. Nenhuma informação é inventada ou editorializada.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span className="text-xs text-green-400 font-medium">100% dados públicos e oficiais</span>
            </div>
          </div>
        </div>

        {/* Lado direito — roleta de fotos */}
        <div className="hidden lg:block">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-white/30">
            Clique em um político para ver o perfil completo
          </p>
          <PoliticoCarousel deputados={deputados} />
        </div>
      </div>
    </div>
  );
}

// ── Stat strip ────────────────────────────────────────────────────────────────

function StatStrip({ stats, activities, status }: { stats: Stats; activities: Activity[]; status: ApiStatus }) {
  const votacoes = activities.filter((a) => a.type === "votacao");
  const aprovadas = votacoes.filter((a) => a.aprovacao === 1).length;
  const rejeitadas = votacoes.filter((a) => a.aprovacao === 0).length;

  const items = [
    { label: "Políticos",       value: stats.deputados + stats.senadores, sub: "Dep. + Senadores", color: "text-blue-600",   bg: "bg-blue-50",   icon: "👤" },
    { label: "Partidos",        value: stats.partidos,                    sub: "Registrados",       color: "text-violet-600", bg: "bg-violet-50", icon: "🏛" },
    { label: "Aprovadas",       value: aprovadas,                         sub: "últ. 30 dias",      color: "text-green-600",  bg: "bg-green-50",  icon: "✓"  },
    { label: "Rejeitadas",      value: rejeitadas,                        sub: "últ. 30 dias",      color: "text-red-500",    bg: "bg-red-50",    icon: "✗"  },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.07 }}
          className={`rounded-2xl border border-slate-100 ${s.bg} p-4 shadow-sm`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
          {status === "loading" ? (
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className={`mt-1 text-3xl font-extrabold ${s.color}`}>{s.value}</p>
          )}
          <p className="mt-0.5 text-[11px] text-slate-400">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Feature showcase ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: "Perfil Completo",
    desc: "Biografia, patrimônio declarado, gastos CEAP, votações e todas as proposições de cada deputado.",
    to: "/politicos",
    color: "blue",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Comparar Políticos",
    desc: "Dois deputados lado a lado: proposições, patrimônio, gastos e índice de atividade legislativa.",
    to: "/comparar",
    color: "violet",
    badge: "Novo",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
    title: "Partidos em Detalhe",
    desc: "Votações por bancada, gastos coletivos, lideranças e popularidade de cada partido na Câmara.",
    to: "/partidos",
    color: "indigo",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
    title: "Leis e Votações",
    desc: "Proposições em tramitação e votações do plenário com glossário explicando cada sigla.",
    to: "/leis",
    color: "teal",
  },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; badge: string; border: string }> = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   badge: "bg-blue-600",   border: "border-blue-100"   },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", badge: "bg-violet-600", border: "border-violet-100" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", badge: "bg-indigo-600", border: "border-indigo-100" },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   badge: "bg-teal-600",   border: "border-teal-100"   },
};

function FeatureShowcase() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">O que você pode fazer aqui</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEATURES.map((f, i) => {
          const cls = COLOR_MAP[f.color];
          return (
            <motion.div
              key={f.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <Link
                to={f.to}
                className={`group flex items-start gap-4 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${cls.bg} ${cls.border}`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${cls.icon}`}>{f.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{f.title}</p>
                    {"badge" in f && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${cls.badge}`}>
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{f.desc}</p>
                </div>
                <svg className={`mt-1 h-4 w-4 flex-shrink-0 transition group-hover:translate-x-0.5 ${cls.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


// ── Sobre a plataforma ────────────────────────────────────────────────────────

const APIS = [
  {
    nome: "API da Câmara dos Deputados",
    url: "dadosabertos.camara.leg.br",
    cor: "bg-blue-600",
    usos: [
      "Lista de todos os 513 deputados federais em exercício",
      "Proposições (PLs, PECs, Requerimentos) por deputado e por tipo",
      "Votações do plenário e comissões com resultado (aprovado/rejeitado)",
      "Despesas do CEAP — verba de gabinete de cada deputado",
      "Perfil detalhado: escolaridade, nascimento, gabinete, redes sociais",
      "Composição e liderança dos partidos",
    ],
  },
  {
    nome: "API do Senado Federal",
    url: "legis.senado.leg.br",
    cor: "bg-indigo-600",
    usos: [
      "Lista de senadores em exercício com partido e UF",
      "Votações do Senado com posicionamento de cada senador",
      "Fotos e páginas individuais de cada senador",
    ],
  },
  {
    nome: "TSE — Tribunal Superior Eleitoral",
    url: "cdn.tse.jus.br (arquivos CSV)",
    cor: "bg-red-600",
    usos: [
      "Patrimônio declarado por cada candidato nas eleições de 2022",
      "Bens por categoria: imóveis, veículos, aplicações financeiras etc.",
      "Cruzamento por nome civil e UF para identificar o político correto",
    ],
  },
  {
    nome: "Wikipedia (REST API)",
    url: "pt.wikipedia.org/api",
    cor: "bg-slate-600",
    usos: [
      "Biografias resumidas de deputados e senadores",
      "Fotos de perfil quando a Câmara não fornece",
      "Popularidade medida por visualizações de página (pageviews)",
    ],
  },
  {
    nome: "Assembleias Legislativas Estaduais",
    url: "APIs individuais por estado (SP, RJ, MG…)",
    cor: "bg-teal-600",
    usos: [
      "Deputados estaduais em exercício por UF",
      "Perfil e mandato de cada deputado estadual",
      "Cada assembleia tem formato próprio — sem padronização nacional",
    ],
  },
];

function SobrePlataforma() {
  return (
    <section id="sobre" className="mt-12 scroll-mt-20">
      {/* Manifesto */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-8 py-10 shadow-xl mb-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500 opacity-10 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-6 rounded-full bg-blue-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Por que este site existe</span>
          </div>

          <h2 className="mb-5 text-2xl font-extrabold leading-snug text-white sm:text-3xl">
            Dados públicos que o governo<br />
            <span className="text-blue-300">dificulta você de achar</span>
          </h2>

          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <p>
              Toda a informação exibida aqui é <span className="font-semibold text-white">100% pública</span> — coletada de APIs oficiais da Câmara dos Deputados, Senado Federal e TSE. São dados que, por lei, pertencem a você. O problema é que os sites criados pelo próprio governo são construídos de forma que tornam esses dados <span className="font-semibold text-yellow-300">praticamente inacessíveis ao cidadão comum</span>.
            </p>
            <p>
              A API da Câmara retorna campos com nomes técnicos sem nenhuma explicação. O TSE distribui dados de patrimônio em arquivos ZIP com CSVs de centenas de megabytes, sem qualquer interface de busca útil. As assembleias legislativas estaduais têm cada uma o seu próprio sistema incompatível — algumas nem têm API. O Senado usa formatos XML de outra era.
            </p>
            <p>
              Não acreditamos que isso seja acidente. <span className="font-semibold text-white">Complexidade é uma forma de opacidade.</span> Quando você precisa de conhecimento técnico avançado para simplesmente descobrir o patrimônio do seu representante eleito, a transparência deixou de existir na prática.
            </p>
            <p className="font-semibold text-white">
              Democratização de Dados foi criado para quebrar essa barreira — sem partido, sem agenda. Só dados, apresentados de forma humana.
            </p>
          </div>
        </div>
      </div>

      {/* APIs */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">Fontes de dados utilizadas</h3>
        <p className="text-xs text-slate-500 mt-0.5">Todas as APIs são públicas e oficiais. Nenhum dado é inventado ou editorializado.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APIS.map((api, i) => (
          <motion.div
            key={api.nome}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-start gap-3">
              <div className={`mt-0.5 h-3 w-3 flex-shrink-0 rounded-full ${api.cor}`} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-tight">{api.nome}</p>
                <p className="mt-0.5 text-[11px] font-mono text-slate-400 truncate">{api.url}</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {api.usos.map((uso) => (
                <li key={uso} className="flex items-start gap-2 text-[12px] text-slate-600 leading-relaxed">
                  <svg className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {uso}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Rodapé da seção */}
      <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-6 py-4">
        <p className="text-xs leading-relaxed text-amber-800">
          <span className="font-bold">Limitações conhecidas:</span> O patrimônio é baseado na declaração de 2022 (a mais recente disponível no TSE). Votações individuais de deputados têm um atraso de publicação de vários meses na API oficial. Nenhum dado de vereadores está disponível — as 5.570 câmaras municipais não têm API unificada.
        </p>
      </div>
    </section>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export function HomePage() {
  const [stats, setStats] = useState<Stats>({ deputados: 0, senadores: 0, partidos: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [status, setStatus] = useState<ApiStatus>("loading");

  useEffect(() => {
    Promise.all([
      api.camara.deputados(),
      api.senado.senadores(),
      api.camara.partidos(),
      api.atividades.recentes(),
    ])
      .then(([dep, sen, part, ativ]) => {
        setDeputados(dep);
        setStats({ deputados: dep.length, senadores: sen.length, partidos: part.length });
        setActivities(ativ);
        setStatus("success");
      })
      .catch((err: Error) => setStatus(err.message === "offline" ? "offline" : "error"));
  }, []);

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {(status === "offline" || status === "error") && (
          <div className="mb-6"><OfflineBanner source="backend (localhost:8000)" /></div>
        )}

        <Hero deputados={deputados} />

        <StatStrip stats={stats} activities={activities} status={status} />

        <FeatureShowcase />

        <SobrePlataforma />
      </main>
    </PageTransition>
  );
}
