/**
 * Cores por tipo de proposição.
 *
 * Fonte única para as cores utilizadas nas páginas que exibem
 * tipos de proposições legislativas.
 */

const TIPO_COLORS: Record<string, string> = {
  PL: "bg-blue-50 text-blue-700 border-blue-200",
  PEC: "bg-purple-50 text-purple-700 border-purple-200",
  PDC: "bg-amber-50 text-amber-700 border-amber-200",
  MPV: "bg-orange-50 text-orange-700 border-orange-200",
  PDL: "bg-green-50 text-green-700 border-green-200",
  PLP: "bg-teal-50 text-teal-700 border-teal-200",
  REQ: "bg-slate-50 text-slate-600 border-slate-200",
  RIC: "bg-slate-50 text-slate-600 border-slate-200",
  MSC: "bg-slate-50 text-slate-600 border-slate-200",
  INC: "bg-slate-50 text-slate-600 border-slate-200",
};

const DEFAULT_TIPO_COLOR =
  "bg-slate-50 text-slate-600 border-slate-200";

export function tipoColor(sigla: string): string {
  const chave = sigla.trim().toUpperCase();

  return TIPO_COLORS[chave] ?? DEFAULT_TIPO_COLOR;
}