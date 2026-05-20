import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { api } from "../services/api";
import type { ApiStatus, CompararDeputado, CompararResult, Deputado } from "../types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function calcIdade(dataNasc?: string | null) {
  if (!dataNasc) return null;
  const d = new Date(dataNasc);
  if (isNaN(d.getTime())) return null;
  return new Date().getFullYear() - d.getFullYear();
}

const TIPO_LABEL: Record<string, string> = {
  PL: "Projeto de Lei",
  PEC: "Emenda Constitucional",
  PLP: "Lei Complementar",
  REQ: "Requerimento",
  INC: "Indicação",
  MPV: "Medida Provisória",
  PDL: "Decreto Legislativo",
  MSC: "Mensagem",
  PROC: "Protocolo",
};

// ── Politician selector ────────────────────────────────────────────────────────

function DeputadoAvatar({
  dep,
  size = "sm",
  accentBg,
}: {
  dep: Deputado;
  size?: "sm" | "lg";
  accentBg: string;
}) {
  const dim = size === "lg" ? "h-16 w-16 text-2xl" : "h-10 w-10 text-sm";
  return dep.url_foto ? (
    <img
      src={dep.url_foto}
      alt={dep.nome}
      className={`${dim} rounded-full object-cover border-2 border-white shadow flex-shrink-0`}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  ) : (
    <div className={`${dim} ${accentBg} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {dep.nome.charAt(0)}
    </div>
  );
}

// ── Custom select dropdown (stays inside the page, with scroll) ────────────────

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  accentRing,
  wide = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  accentRing: string;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${wide ? "flex-1 min-w-0" : "w-24 flex-shrink-0"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 ${accentRing} transition`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg className={`h-3 w-3 flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.13 }}
            style={{ transformOrigin: "top" }}
            className="absolute left-0 top-full z-50 mt-1 w-full min-w-[8rem] max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl"
          >
            <li>
              <button
                type="button"
                onMouseDown={() => { onChange(""); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-xs font-semibold ${!value ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-50"} transition`}
              >
                {placeholder}
              </button>
            </li>
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onMouseDown={() => { onChange(opt); setOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold transition ${opt === value ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeputadoSelector({
  label,
  side,
  all,
  selected,
  onSelect,
}: {
  label: string;
  side: "a" | "b";
  all: Deputado[];
  selected: Deputado | null;
  onSelect: (d: Deputado | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [partido, setPartido] = useState("");
  const [uf, setUf] = useState("");
  const [open, setOpen] = useState(false);

  const isA = side === "a";
  const accent      = isA ? "text-blue-600"   : "text-violet-600";
  const accentBg    = isA ? "bg-blue-500"     : "bg-violet-500";
  const accentBorder = isA ? "border-blue-300" : "border-violet-300";
  const accentRing  = isA ? "focus:ring-blue-300 focus:border-blue-400" : "focus:ring-violet-300 focus:border-violet-400";
  const accentCard  = isA ? "border-blue-200 bg-blue-50" : "border-violet-200 bg-violet-50";
  const badgeCls    = isA ? "bg-blue-600"     : "bg-violet-600";

  const partidos = useMemo(
    () => Array.from(new Set(all.map((d) => d.sigla_partido))).sort(),
    [all],
  );
  const ufs = useMemo(
    () => Array.from(new Set(all.map((d) => d.sigla_uf))).sort(),
    [all],
  );

  const filtered = useMemo(() => {
    let list = all;
    if (partido) list = list.filter((d) => d.sigla_partido === partido);
    if (uf) list = list.filter((d) => d.sigla_uf === uf);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((d) => d.nome.toLowerCase().includes(q));
    }
    return list.slice(0, 10);
  }, [all, query, partido, uf]);

  const showList = open && (query.trim() || partido || uf);

  function pick(d: Deputado) {
    onSelect(d);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="flex-1 min-w-0">
      <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${accent}`}>{label}</p>

      {selected ? (
        /* ── Selected state ── */
        <div className={`flex items-center gap-3 rounded-2xl border-2 p-4 shadow-sm ${accentCard}`}>
          <DeputadoAvatar dep={selected} size="lg" accentBg={accentBg} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-slate-900 truncate leading-tight">{selected.nome}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${badgeCls}`}>
                {selected.sigla_partido}
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {selected.sigla_uf}
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="ml-auto flex-shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-red-500 transition"
            aria-label="Remover"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* ── Search state ── */
        <div className={`rounded-2xl border-2 bg-white shadow-sm ${accentBorder}`}>
          {/* Filter row */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <CustomSelect
              value={partido}
              onChange={(v) => { setPartido(v); setOpen(true); }}
              options={partidos}
              placeholder="Todos os partidos"
              accentRing={accentRing}
              wide
            />
            <CustomSelect
              value={uf}
              onChange={(v) => { setUf(v); setOpen(true); }}
              options={ufs}
              placeholder="Todos UF"
              accentRing={accentRing}
            />
          </div>

          {/* Name search */}
          <div className="relative px-3 py-2">
            <svg className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 160)}
              className={`w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 ${accentRing}`}
            />
          </div>

          {/* Dropdown results */}
          <AnimatePresence>
            {showList && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden border-t border-slate-100"
              >
                {filtered.length === 0 ? (
                  <li className="px-4 py-4 text-center text-xs text-slate-400">Nenhum resultado encontrado</li>
                ) : (
                  filtered.map((d) => (
                    <li key={d.id} className="border-b border-slate-50 last:border-0">
                      <button
                        onMouseDown={() => pick(d)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition"
                      >
                        <DeputadoAvatar dep={d} size="sm" accentBg={accentBg} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{d.nome}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${badgeCls}`}>
                              {d.sigla_partido}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">{d.sigla_uf}</span>
                          </div>
                        </div>
                        <svg className={`h-3.5 w-3.5 flex-shrink-0 ${accent} opacity-50`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </li>
                  ))
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Score gauge ────────────────────────────────────────────────────────────────

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const pct = (score / 10) * 100;
  const strokeColor = color === "blue" ? "#3b82f6" : "#8b5cf6";
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-800">{score}</span>
          <span className="text-[10px] text-slate-400 font-semibold">/10</span>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-slate-500 text-center">Índice de<br />Atividade</p>
    </div>
  );
}

// ── Metric card (main metrics) ────────────────────────────────────────────────

function MetricCard({
  label,
  icon,
  valA,
  valB,
  fmt,
  invert = false,
  nameA,
  nameB,
}: {
  label: string;
  icon: React.ReactNode;
  valA: number;
  valB: number;
  fmt: (n: number) => string;
  invert?: boolean;
  nameA: string;
  nameB: string;
}) {
  const max = Math.max(valA, valB, 1);
  const pctA = (valA / max) * 100;
  const pctB = (valB / max) * 100;
  const winnerA = invert ? valA <= valB : valA >= valB;
  const tie = valA === valB;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
        {invert && (
          <span className="ml-auto text-[10px] font-semibold text-slate-400">(menor = melhor)</span>
        )}
      </div>

      <div className="p-5">
        {/* Values */}
        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* A */}
          <div className={`flex flex-col items-end gap-1 transition-opacity ${!winnerA && !tie ? "opacity-40" : ""}`}>
            <span className="text-[11px] font-semibold text-blue-400 truncate max-w-full">{nameA}</span>
            <span className={`text-2xl font-extrabold leading-none ${winnerA || tie ? "text-blue-600" : "text-slate-400"}`}>
              {fmt(valA)}
            </span>
            {winnerA && !tie && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                ★ Melhor
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-px bg-slate-200" />
            <span className="text-[9px] font-black text-slate-300">VS</span>
            <div className="h-10 w-px bg-slate-200" />
          </div>

          {/* B */}
          <div className={`flex flex-col items-start gap-1 transition-opacity ${winnerA && !tie ? "opacity-40" : ""}`}>
            <span className="text-[11px] font-semibold text-violet-400 truncate max-w-full">{nameB}</span>
            <span className={`text-2xl font-extrabold leading-none ${!winnerA || tie ? "text-violet-600" : "text-slate-400"}`}>
              {fmt(valB)}
            </span>
            {!winnerA && !tie && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                ★ Melhor
              </span>
            )}
          </div>
        </div>

        {/* Back-to-back progress bars */}
        <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={`h-full origin-right ${winnerA || tie ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-blue-200"}`}
            style={{ marginLeft: "auto" }}
            initial={{ width: 0 }}
            animate={{ width: `${pctA / 2}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <div className="w-0.5 flex-shrink-0 bg-white" />
          <motion.div
            className={`h-full origin-left ${!winnerA || tie ? "bg-gradient-to-r from-violet-400 to-violet-600" : "bg-violet-200"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pctB / 2}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Tipo row (proposições breakdown) ──────────────────────────────────────────

function TipoRow({
  tipo,
  label,
  vA,
  vB,
}: {
  tipo: string;
  label: string;
  vA: number;
  vB: number;
}) {
  const max = Math.max(vA, vB, 1);
  const pctA = (vA / max) * 100;
  const pctB = (vB / max) * 100;
  const winnerA = vA >= vB;
  const tie = vA === vB;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{tipo}</span>
      </div>
      <div className="grid grid-cols-[1fr_1rem_1fr] items-center gap-2">
        {/* A side — right-aligned bar */}
        <div className="flex flex-col items-end gap-1">
          <span className={`text-base font-extrabold leading-none ${!tie && winnerA ? "text-blue-600" : vA === 0 ? "text-slate-300" : "text-slate-500"}`}>
            {vA}
          </span>
          <div className="flex w-full justify-end">
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className={`h-full rounded-full ${!tie && winnerA ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-blue-200"}`}
                initial={{ width: 0 }}
                animate={{ width: `${pctA}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="text-center text-[9px] font-black text-slate-300">VS</div>

        {/* B side */}
        <div className="flex flex-col items-start gap-1">
          <span className={`text-base font-extrabold leading-none ${!tie && !winnerA ? "text-violet-600" : vB === 0 ? "text-slate-300" : "text-slate-500"}`}>
            {vB}
          </span>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className={`h-full rounded-full ${!tie && !winnerA ? "bg-gradient-to-r from-violet-400 to-violet-600" : "bg-violet-200"}`}
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile header card ────────────────────────────────────────────────────────

function ProfileCard({
  dep,
  color,
}: {
  dep: CompararDeputado;
  color: "blue" | "violet";
}) {
  const idade = calcIdade(dep.data_nascimento);
  const borderCls = color === "blue" ? "border-blue-400 bg-blue-50" : "border-violet-400 bg-violet-50";
  const badgeCls = color === "blue" ? "bg-blue-600" : "bg-violet-600";
  const linkTo = `/politicos/deputado/${dep.id}`;

  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center ${borderCls}`}>
      {dep.url_foto ? (
        <img
          src={dep.url_foto}
          alt={dep.nome}
          className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-lg ${badgeCls}`}>
          {dep.nome.charAt(0)}
        </div>
      )}

      <div>
        <h2 className="text-base font-extrabold text-slate-900 leading-tight">{dep.nome}</h2>
        <div className="mt-1 flex flex-wrap justify-center gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${badgeCls}`}>
            {dep.sigla_partido}
          </span>
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            {dep.sigla_uf}
          </span>
        </div>
        {dep.escolaridade && (
          <p className="mt-1.5 text-[11px] text-slate-500">{dep.escolaridade}</p>
        )}
        {idade && (
          <p className="text-[11px] text-slate-400">{idade} anos</p>
        )}
      </div>

      <div className="w-full border-t border-white pt-3">
        <ScoreGauge score={dep.score_atividade} color={color} />
      </div>

      <Link
        to={linkTo}
        className={`mt-1 w-full rounded-xl py-2 text-xs font-bold text-white transition hover:opacity-90 ${badgeCls}`}
      >
        Ver perfil completo →
      </Link>
    </div>
  );
}

// ── Tipo breakdown ─────────────────────────────────────────────────────────────

function TipoBreakdown({ a, b }: { a: CompararDeputado; b: CompararDeputado }) {
  const allTipos = Array.from(
    new Set([...Object.keys(a.proposicoes_por_tipo), ...Object.keys(b.proposicoes_por_tipo)])
  ).sort((x, y) => {
    const sum = (d: CompararDeputado, t: string) => d.proposicoes_por_tipo[t] ?? 0;
    return (sum(b, y) + sum(a, y)) - (sum(a, x) + sum(b, x));
  });

  if (allTipos.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Proposições por Tipo</span>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
        {allTipos.slice(0, 8).map((tipo) => {
          const vA = a.proposicoes_por_tipo[tipo] ?? 0;
          const vB = b.proposicoes_por_tipo[tipo] ?? 0;
          return (
            <TipoRow
              key={tipo}
              tipo={tipo}
              label={TIPO_LABEL[tipo] ?? tipo}
              vA={vA}
              vB={vB}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Main comparison view ───────────────────────────────────────────────────────

function ComparisonView({ result }: { result: CompararResult }) {
  const { a, b } = result;
  const nomeA = a.nome.split(" ")[0];
  const nomeB = b.nome.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-5"
    >
      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] items-start">
        <ProfileCard dep={a} color="blue" />

        <div className="hidden sm:flex flex-col items-center justify-center self-center gap-2 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 shadow-lg">
            <span className="text-base font-extrabold text-white">VS</span>
          </div>
        </div>

        <ProfileCard dep={b} color="violet" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Proposições Totais"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
          valA={a.proposicoes_total}
          valB={b.proposicoes_total}
          fmt={(n: number) => String(n)}
          nameA={nomeA}
          nameB={nomeB}
        />
        <MetricCard
          label="Patrimônio (TSE 2022)"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          }
          valA={a.patrimonio_total}
          valB={b.patrimonio_total}
          fmt={fmtBRL}
          nameA={nomeA}
          nameB={nomeB}
        />
        <MetricCard
          label="Gastos CEAP"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          }
          valA={a.gastos_total}
          valB={b.gastos_total}
          fmt={fmtBRL}
          invert
          nameA={nomeA}
          nameB={nomeB}
        />
      </div>

      {/* Tipo breakdown */}
      <TipoBreakdown a={a} b={b} />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          {nomeA} — Deputado A
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          {nomeB} — Deputado B
        </span>
        <span className="ml-auto">
          Patrimônio: TSE 2022 · Gastos: CEAP · Proposições: 57ª legislatura
        </span>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function CompararPage() {
  const [all, setAll] = useState<Deputado[]>([]);
  const [selA, setSelA] = useState<Deputado | null>(null);
  const [selB, setSelB] = useState<Deputado | null>(null);
  const [result, setResult] = useState<CompararResult | null>(null);
  const [status, setStatus] = useState<ApiStatus>("idle");

  useEffect(() => {
    api.camara.deputados().then(setAll).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selA || !selB) {
      setResult(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setResult(null);
    api.comparar
      .deputados(selA.id, selB.id)
      .then((r) => { setResult(r); setStatus("success"); })
      .catch(() => setStatus("error"));
  }, [selA, selB]);

  return (
    <PageTransition direction="up">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Comparar Políticos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Selecione dois deputados e compare patrimônio, proposições, gastos e índice de atividade legislativa.
          </p>
        </div>

        {/* Selectors */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <DeputadoSelector
            label="Deputado A"
            side="a"
            all={all}
            selected={selA}
            onSelect={(d) => {
              if (d && selB && d.id === selB.id) return;
              setSelA(d);
            }}
          />

          <div className="hidden sm:flex flex-col items-center justify-center pt-8">
            <span className="text-xs font-bold text-slate-300">VS</span>
          </div>

          <DeputadoSelector
            label="Deputado B"
            side="b"
            all={all}
            selected={selB}
            onSelect={(d) => {
              if (d && selA && d.id === selA.id) return;
              setSelB(d);
            }}
          />
        </div>

        {/* States */}
        {status === "idle" && !selA && !selB && (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-slate-400">
            <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            <p className="text-sm font-medium">Escolha dois deputados acima para iniciar a comparação</p>
          </div>
        )}

        {(status === "idle" && (selA || selB)) && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
            <p className="text-sm">Selecione o segundo deputado para comparar</p>
          </div>
        )}

        {status === "loading" && (
          <div className="space-y-4 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
            Não foi possível carregar os dados. Verifique se o backend está rodando.
          </div>
        )}

        {status === "success" && result && <ComparisonView result={result} />}
      </main>
    </PageTransition>
  );
}
