export interface Deputado {
  id: number;
  nome: string;
  sigla_partido: string;
  sigla_uf: string;
  id_legislatura: number;
  url_foto?: string;
  email?: string;
}

export interface Senador {
  codigo: string;
  nome: string;
  nome_completo: string;
  sexo: string;
  partido: string;
  uf: string;
  url_foto?: string;
  url_pagina?: string;
  email?: string;
}

export interface DeputadoVotacao {
  id: string;
  data: string;
  sigla_orgao: string;
  tipo_voto: string;
  proposicao_ementa: string | null;
  proposicao_sigla: string | null;
  proposicao_numero: number | null;
  proposicao_ano: number | null;
}

export interface DeputadoDespesa {
  ano: number;
  mes: number;
  tipo_despesa: string;
  valor_liquido: number;
  nome_fornecedor: string;
  data_documento: string | null;
  url_documento: string | null;
}

export interface GabineteInfo {
  andar: string | null;
  predio: string | null;
  sala: string | null;
  telefone: string | null;
}

export interface DeputadoDetail extends Deputado {
  nome_civil: string;
  sexo: string | null;
  data_nascimento: string | null;
  uf_nascimento: string | null;
  municipio_nascimento: string | null;
  escolaridade: string | null;
  url_website: string | null;
  redes_sociais: string[];
  descricao_status: string | null;
  gabinete: GabineteInfo | null;
  biografia: string | null;
}

export interface Proposicao {
  id: number;
  sigla_tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  data_apresentacao?: string;
  url_inteiro_teor?: string;
  descricao_situacao?: string;
  orgao_situacao?: string;
}

export interface Activity {
  type: string;
  title: string;
  description: string;
  actor: string;
  date: string;
  aprovacao?: number;
  sigla_orgao?: string;
  votacao_id?: string;
  merito?: boolean;
}

export interface PartidoLider {
  nome: string;
  urlFoto?: string;
  uf?: string;
  uri?: string;
}

export interface Partido {
  id: number;
  sigla: string;
  nome: string;
  uri?: string;
  urlLogo?: string;
  urlWebSite?: string;
  urlFacebook?: string;
  totalMembros?: number;
  totalPosse?: number;
  situacao?: string;
  lider?: PartidoLider;
}

export interface Votacao {
  id: string;
  data: string;
  data_hora_registro: string;
  sigla_orgao: string;
  proposicao_objeto: string | null;
  descricao: string;
  aprovacao: number;
  merito: boolean;
  proposicao_ementa?: string | null;
}

export interface PatrimonioItem {
  descricao: string;
  tipo: string;
  valor: number;
}

export interface Patrimonio {
  total: number;
  categorias: Record<string, number>;
  itens: PatrimonioItem[];
  fonte: string;
}

export interface DeputadoEstadual {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  mandato: string;
  url_foto?: string;
  email?: string;
  url_pagina?: string;
  biografia?: string;
}

export interface PartidoLiderInfo {
  nome: string;
  uf?: string;
  urlFoto?: string;
  urlFotoWiki?: string;
  uri?: string;
  pageviews?: number;
  urlWiki?: string;
  codigoSenador?: string;
  idDeputado?: number;
}

export interface PartidoLideranca {
  popularidade_camara: number;
  lider_camara: PartidoLiderInfo | null;
  presidente: PartidoLiderInfo | null;
}

export interface PartidoVotacao {
  id: string;
  data: string;
  descricao: string;
  sim: number;
  nao: number;
  abstencao: number;
}

export interface PartidoVotacoesStats {
  total_sim: number;
  total_nao: number;
  total_abstencao: number;
  votacoes: PartidoVotacao[];
}

export interface PartidoGastosCategoria {
  categoria: string;
  valor: number;
}

export interface PartidoGastos {
  total: number;
  categorias: PartidoGastosCategoria[];
  ano?: number;
}

export interface VotacaoVotoPartido {
  sigla: string;
  sim: number;
  nao: number;
  abstencao: number;
  outros: number;
}

export interface VotacaoVotos {
  total: number;
  partidos: VotacaoVotoPartido[];
}

export interface CompararDeputado {
  id: number;
  nome: string;
  nome_civil: string;
  sigla_partido: string;
  sigla_uf: string;
  url_foto?: string;
  id_legislatura: number;
  escolaridade?: string;
  data_nascimento?: string;
  proposicoes_total: number;
  proposicoes_por_tipo: Record<string, number>;
  gastos_total: number;
  patrimonio_total: number;
  score_atividade: number;
}

export interface CompararResult {
  a: CompararDeputado;
  b: CompararDeputado;
}

export interface ProposicoesDeputado {
  itens: Proposicao[];
  total: number;
}

export type ApiStatus = "idle" | "loading" | "success" | "error" | "offline";
