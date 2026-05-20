import type { Activity, CompararResult, Deputado, DeputadoDetail, DeputadoDespesa, DeputadoEstadual, DeputadoVotacao, Partido, PartidoGastos, PartidoLideranca, PartidoVotacoesStats, Patrimonio, Proposicao, Senador, Votacao, VotacaoVotos } from "../types";


const BASE_URL = `http://${window.location.hostname}:8000/api/v1`;

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);

  if (response.status === 503) {
    throw new Error("offline");
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  camara: {
    deputados: (legislatura = 57) =>
      fetchJSON<Deputado[]>(`/camara/deputados?legislatura=${legislatura}`),
    deputadoById: (id: number) =>
      fetchJSON<DeputadoDetail>(`/camara/deputados/${id}`),
    deputadoVotacoes: (id: number) =>
      fetchJSON<DeputadoVotacao[]>(`/camara/deputados/${id}/votacoes`),
    deputadoProposicoes: (id: number) =>
      fetchJSON<Proposicao[]>(`/camara/deputados/${id}/proposicoes`),
    deputadoDespesas: (id: number, ano = 2025) =>
      fetchJSON<DeputadoDespesa[]>(`/camara/deputados/${id}/despesas?ano=${ano}`),
    partidos: () =>
      fetchJSON<Partido[]>("/camara/partidos"),
    partidoById: (id: number) =>
      fetchJSON<Partido>(`/camara/partidos/${id}`),
    partidoLideranca: (id: number) =>
      fetchJSON<PartidoLideranca>(`/camara/partidos/${id}/lideranca`),
    partidoVotacoesStats: (id: number) =>
      fetchJSON<PartidoVotacoesStats>(`/camara/partidos/${id}/votacoes-stats`),
    partidoGastos: (id: number) =>
      fetchJSON<PartidoGastos>(`/camara/partidos/${id}/gastos`),
    proposicoes: (ano = 2024, tipo = "PL", itens = 20) =>
      fetchJSON<Proposicao[]>(`/camara/proposicoes?ano=${ano}&tipo=${tipo}&itens=${itens}`),
    votacoes: (itens = 30, dataInicio?: string) =>
      fetchJSON<Votacao[]>(
        `/camara/votacoes?itens=${itens}${dataInicio ? `&data_inicio=${dataInicio}` : ""}`,
      ),
    votacaoVotos: (id: string) =>
      fetchJSON<VotacaoVotos>(`/camara/votacoes/${id}/votos`),
  },
  senado: {
    senadores: () =>
      fetchJSON<Senador[]>("/senado/senadores"),
    senadorVotacoes: (codigo: string, dataInicio?: string) =>
      fetchJSON<DeputadoVotacao[]>(
        `/senado/senadores/${codigo}/votacoes${dataInicio ? `?data_inicio=${dataInicio}` : ""}`,
      ),
  },
  atividades: {
    recentes: () =>
      fetchJSON<Activity[]>("/atividades/recentes"),
  },
  estaduais: {
    deputados: (uf = "SP") =>
      fetchJSON<DeputadoEstadual[]>(`/estaduais/deputados?uf=${uf}`),
    deputadoById: (id: number) =>
      fetchJSON<DeputadoEstadual>(`/estaduais/deputados/${id}`),
  },
  patrimonio: {
    deputadoFederal: (nome: string, nomeCivil = "") =>
      fetchJSON<Patrimonio>(`/patrimonio/deputado-federal?nome=${encodeURIComponent(nome)}&nome_civil=${encodeURIComponent(nomeCivil)}`),
    senador: (nome: string) =>
      fetchJSON<Patrimonio>(`/patrimonio/senador?nome=${encodeURIComponent(nome)}`),
    deputadoEstadual: (nome: string, uf = "SP") =>
      fetchJSON<Patrimonio>(`/patrimonio/deputado-estadual?nome=${encodeURIComponent(nome)}&uf=${uf}`),
  },
  comparar: {
    deputados: (idA: number, idB: number) =>
      fetchJSON<CompararResult>(`/comparar/deputados/${idA}/${idB}`),
  },
};
