/**
 * Datas "puras" da API (ex: "2026-08-11", sem T) são interpretadas como UTC
 * pelo Date() nativo do JS. Em fuso negativo (Brasília, UTC-3) isso desloca
 * o dia exibido em -1. Forçar meia-noite local evita o shift, sem afetar
 * strings que já têm horário (essas seguem sendo interpretadas como local,
 * que é o comportamento correto).
 */
function toLocalDate(iso: string): Date {
  const withTime = iso.includes("T") ? iso : `${iso}T00:00:00`;
  return new Date(withTime);
}

export function fmtDate(iso: string | undefined | null, month: "long" | "short" = "long"): string {
  if (!iso) return "—";
  try {
    return toLocalDate(iso).toLocaleDateString("pt-BR", { day: "2-digit", month, year: "numeric" });
  } catch {
    return iso;
  }
}

/**
 * Retorna vazio para datas puras — elas não carregam horário nenhum na
 * fonte, então mostrar uma "hora" formatada a partir delas seria inventar
 * um dado que não existe (era exatamente o bug: "21:00" fabricado a partir
 * de uma data sem horário).
 */
export function fmtTime(iso: string | undefined | null): string {
  if (!iso || !iso.includes("T")) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
