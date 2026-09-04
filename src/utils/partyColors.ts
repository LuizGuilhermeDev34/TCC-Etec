/**
 * Fonte única de cor por partido. Antes, cada tela mantinha seu próprio mapa
 * copiado à mão — o mesmo partido (ex: PSD) saía roxo em algumas telas e
 * cinza-ardósia em outras, sem nenhum motivo, só porque as cópias divergiram
 * com o tempo (achado da auditoria de código, F-19).
 *
 * As classes do Tailwind abaixo são todas strings literais, não compostas
 * (`bg-${hue}-500`) — o scanner do Tailwind só inclui no build classes que
 * aparecem como texto literal no código-fonte; montar o nome em runtime faz
 * a cor sumir silenciosamente (build passa, CSS não existe).
 */

type HueStyle = {
  /** fundo claro + texto forte — badges pequenos, listas */
  light: string;
  /** fundo claro + texto + borda — badges com contorno */
  bordered: string;
  /** fundo forte + texto branco — avatares/iniciais */
  solid: { bg: string; text: string };
  /** fundo forte + texto branco + anel — cards com destaque */
  solidRing: { bg: string; text: string; ring: string };
};

const HUE_STYLES: Record<string, HueStyle> = {
  red: {
    light: "bg-red-100 text-red-700",
    bordered: "bg-red-100 text-red-700 border-red-200",
    solid: { bg: "bg-red-500", text: "text-white" },
    solidRing: { bg: "bg-red-500", text: "text-white", ring: "ring-red-200" },
  },
  blue: {
    light: "bg-blue-100 text-blue-700",
    bordered: "bg-blue-100 text-blue-700 border-blue-200",
    solid: { bg: "bg-blue-500", text: "text-white" },
    solidRing: { bg: "bg-blue-500", text: "text-white", ring: "ring-blue-200" },
  },
  green: {
    light: "bg-green-100 text-green-700",
    bordered: "bg-green-100 text-green-700 border-green-200",
    solid: { bg: "bg-green-500", text: "text-white" },
    solidRing: { bg: "bg-green-500", text: "text-white", ring: "ring-green-200" },
  },
  slate: {
    light: "bg-slate-200 text-slate-700",
    bordered: "bg-slate-100 text-slate-600 border-slate-200",
    solid: { bg: "bg-slate-700", text: "text-white" },
    solidRing: { bg: "bg-slate-700", text: "text-white", ring: "ring-slate-300" },
  },
  purple: {
    light: "bg-purple-100 text-purple-700",
    bordered: "bg-purple-100 text-purple-700 border-purple-200",
    solid: { bg: "bg-purple-500", text: "text-white" },
    solidRing: { bg: "bg-purple-500", text: "text-white", ring: "ring-purple-200" },
  },
  pink: {
    light: "bg-pink-100 text-pink-700",
    bordered: "bg-pink-100 text-pink-700 border-pink-200",
    solid: { bg: "bg-pink-500", text: "text-white" },
    solidRing: { bg: "bg-pink-500", text: "text-white", ring: "ring-pink-200" },
  },
  orange: {
    light: "bg-orange-100 text-orange-700",
    bordered: "bg-orange-100 text-orange-700 border-orange-200",
    solid: { bg: "bg-orange-500", text: "text-white" },
    solidRing: { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-200" },
  },
  rose: {
    light: "bg-rose-100 text-rose-700",
    bordered: "bg-rose-100 text-rose-700 border-rose-200",
    solid: { bg: "bg-rose-500", text: "text-white" },
    solidRing: { bg: "bg-rose-500", text: "text-white", ring: "ring-rose-200" },
  },
  violet: {
    light: "bg-violet-100 text-violet-700",
    bordered: "bg-violet-100 text-violet-700 border-violet-200",
    solid: { bg: "bg-violet-600", text: "text-white" },
    solidRing: { bg: "bg-violet-600", text: "text-white", ring: "ring-violet-200" },
  },
  yellow: {
    light: "bg-yellow-100 text-yellow-700",
    bordered: "bg-yellow-100 text-yellow-700 border-yellow-200",
    solid: { bg: "bg-yellow-500", text: "text-white" },
    solidRing: { bg: "bg-yellow-500", text: "text-white", ring: "ring-yellow-200" },
  },
  sky: {
    light: "bg-sky-100 text-sky-700",
    bordered: "bg-sky-100 text-sky-700 border-sky-200",
    solid: { bg: "bg-sky-500", text: "text-white" },
    solidRing: { bg: "bg-sky-500", text: "text-white", ring: "ring-sky-200" },
  },
  teal: {
    light: "bg-teal-100 text-teal-700",
    bordered: "bg-teal-100 text-teal-700 border-teal-200",
    solid: { bg: "bg-teal-500", text: "text-white" },
    solidRing: { bg: "bg-teal-500", text: "text-white", ring: "ring-teal-200" },
  },
  amber: {
    light: "bg-amber-100 text-amber-700",
    bordered: "bg-amber-100 text-amber-700 border-amber-200",
    solid: { bg: "bg-amber-500", text: "text-white" },
    solidRing: { bg: "bg-amber-500", text: "text-white", ring: "ring-amber-200" },
  },
  emerald: {
    light: "bg-emerald-100 text-emerald-700",
    bordered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    solid: { bg: "bg-emerald-600", text: "text-white" },
    solidRing: { bg: "bg-emerald-600", text: "text-white", ring: "ring-emerald-200" },
  },
  lime: {
    light: "bg-lime-100 text-lime-700",
    bordered: "bg-lime-100 text-lime-700 border-lime-200",
    solid: { bg: "bg-lime-600", text: "text-white" },
    solidRing: { bg: "bg-lime-600", text: "text-white", ring: "ring-lime-200" },
  },
  cyan: {
    light: "bg-cyan-100 text-cyan-700",
    bordered: "bg-cyan-100 text-cyan-700 border-cyan-200",
    solid: { bg: "bg-cyan-600", text: "text-white" },
    solidRing: { bg: "bg-cyan-600", text: "text-white", ring: "ring-cyan-200" },
  },
  indigo: {
    light: "bg-indigo-100 text-indigo-700",
    bordered: "bg-indigo-100 text-indigo-700 border-indigo-200",
    solid: { bg: "bg-indigo-500", text: "text-white" },
    solidRing: { bg: "bg-indigo-500", text: "text-white", ring: "ring-indigo-200" },
  },
};

// Uma família de cor por sigla — resolvido para um único valor por partido
// onde as cópias antigas divergiam (ex: PSD era roxo em 3 arquivos e
// cinza-ardósia em 2; ficou roxo).
const PARTY_HUE: Record<string, string> = {
  PT: "red",
  PL: "blue",
  MDB: "green",
  "UNIÃO": "slate",
  PSD: "purple",
  PSB: "pink",
  PDT: "orange",
  PSOL: "rose",
  REPUBLICANOS: "violet",
  PP: "yellow",
  PODE: "sky",
  PODEMOS: "sky",
  AVANTE: "teal",
  SOLIDARIEDADE: "amber",
  PATRIOTA: "emerald",
  PV: "lime",
  DC: "cyan",
  PSDB: "blue",
  CIDADANIA: "indigo",
  AGIR: "indigo",
};

const DEFAULT_HUE = "slate";

function styleFor(sigla: string): HueStyle {
  const hue = PARTY_HUE[sigla?.toUpperCase()] ?? DEFAULT_HUE;
  return HUE_STYLES[hue];
}

export function partyColorLight(sigla: string): string {
  return styleFor(sigla).light;
}

export function partyColorBordered(sigla: string): string {
  return styleFor(sigla).bordered;
}

export function partyColorSolid(sigla: string): { bg: string; text: string } {
  return styleFor(sigla).solid;
}

export function partyColorSolidRing(sigla: string): { bg: string; text: string; ring: string } {
  return styleFor(sigla).solidRing;
}

/** Sigla truncada para caber num avatar/badge redondo pequeno. */
export function partyInitials(sigla: string): string {
  return sigla.length <= 2 ? sigla : sigla.slice(0, 2);
}
