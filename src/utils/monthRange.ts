/**
 * A API de votações da Câmara trata `dataFim` como quase-exclusivo — descarta
 * a maior parte do próprio dia final (confirmado ao vivo: dataFim=2025-12-17
 * retornou 2 votações do dia 17, dataFim=2025-12-18 retornou 89). Por isso
 * `buildDataFim` devolve o primeiro dia do mês SEGUINTE, não o último dia do
 * mês selecionado — senão o filtro perde silenciosamente as votações do fim
 * de todo mês (incluindo o dia inteiro, não só a borda).
 */

export function buildDataInicio(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

export function buildDataFim(mes: number, ano: number): string {
  const primeiroDiaProximoMes = new Date(ano, mes, 1); // mes é 1-indexed: monthIndex=mes já cai no mês seguinte
  const y = primeiroDiaProximoMes.getFullYear();
  const m = primeiroDiaProximoMes.getMonth() + 1;
  const d = primeiroDiaProximoMes.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
