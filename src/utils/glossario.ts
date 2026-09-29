export type GlossarioInfo = {
  nome: string;
  descricao: string;
};

export const GLOSSARIO: Record<string, GlossarioInfo> = {
  // ============================================================
  // PROPOSIÇÕES E DOCUMENTOS
  // ============================================================

  PL: {
    nome: "Projeto de Lei",
    descricao:
      "Proposta de criação ou alteração de uma lei ordinária. Pode ser apresentada por deputados, senadores ou pelo Poder Executivo.",
  },

  PLP: {
    nome: "Projeto de Lei Complementar",
    descricao:
      "Proposta destinada a regulamentar matérias que a Constituição Federal reserva à lei complementar. Sua aprovação exige maioria absoluta.",
  },

  PEC: {
    nome: "Proposta de Emenda à Constituição",
    descricao:
      "Proposta destinada a alterar a Constituição Federal. Sua aprovação exige votação em dois turnos e quórum de três quintos dos parlamentares em cada Casa.",
  },

  MPV: {
    nome: "Medida Provisória",
    descricao:
      "Ato com força de lei editado pelo Presidente da República em situações de relevância e urgência. Possui validade inicial de 60 dias, prorrogável por mais 60, e precisa ser apreciada pelo Congresso Nacional.",
  },

  MP: {
  nome: "Medida Provisória",
  descricao:
    "Ato com força de lei editado pelo Presidente da República em situações de relevância e urgência. Possui validade inicial de 60 dias, prorrogável por mais 60, e precisa ser apreciada pelo Congresso Nacional.",
},

  PDL: {
    nome: "Projeto de Decreto Legislativo",
    descricao:
      "Proposição que trata de matérias de competência exclusiva do Congresso Nacional e não depende de sanção presidencial.",
  },

  INC: {
    nome: "Indicação",
    descricao:
      "Sugestão apresentada por um parlamentar para que outro órgão ou autoridade tome determinada providência. Não possui força de lei.",
  },

  REQ: {
    nome: "Requerimento",
    descricao:
      "Pedido formal apresentado por parlamentar ou comissão. Pode solicitar informações, convocar autoridades, propor urgência, adiamento ou outras providências.",
  },

  RIC: {
    nome: "Requerimento de Informação",
    descricao:
      "Pedido formal de informações apresentado por parlamentar à autoridade competente, especialmente para solicitar esclarecimentos ao Poder Executivo.",
  },

  EMC: {
    nome: "Emenda",
    descricao:
      "Proposta de alteração, acréscimo ou supressão de parte de uma proposição que está em tramitação.",
  },

  RDF: {
    nome: "Redação Final",
    descricao:
      "Texto final da proposição após a incorporação das alterações e correções aprovadas durante sua tramitação.",
  },

  PRL: {
    nome: "Parecer do Relator",
    descricao:
      "Manifestação apresentada pelo parlamentar responsável por analisar uma proposição, contendo sua avaliação e conclusão sobre a matéria.",
  },

  EMP: {
    nome: "Emenda de Plenário",
    descricao:
      "Proposta de alteração apresentada durante a tramitação de uma matéria no Plenário.",
  },

  EMR: {
    nome: "Emenda de Relator",
    descricao:
      "Emenda apresentada pelo relator de determinada matéria, especialmente utilizada no processo de análise e alteração de proposições orçamentárias.",
  },

  MSC: {
    nome: "Mensagem",
    descricao:
      "Comunicação oficial encaminhada pelo Poder Executivo ao Congresso Nacional para tratar de matérias de sua competência.",
  },

  PROC: {
    nome: "Processo Interno",
    descricao:
      "Registro relacionado à tramitação ou aos procedimentos administrativos internos da Câmara dos Deputados.",
  },

  DOC: {
    nome: "Documento",
    descricao:
      "Registro oficial utilizado para documentar informações, decisões, solicitações ou procedimentos.",
  },

  PROPOSICAO: {
    nome: "Proposição",
    descricao:
      "Nome geral dado às matérias apresentadas formalmente ao Legislativo, como projetos de lei, propostas de emenda, requerimentos e outras matérias.",
  },

  EMENTA: {
    nome: "Ementa",
    descricao:
      "Resumo inicial de uma proposição que apresenta de forma breve o assunto ou objetivo da matéria.",
  },

  // ============================================================
  // ESTRUTURA E FUNCIONAMENTO DA CÂMARA
  // ============================================================

  CAMARA: {
    nome: "Câmara dos Deputados",
    descricao:
      "Uma das duas Casas do Congresso Nacional. É formada por deputados federais eleitos para representar a população dos estados e do Distrito Federal.",
  },

  MESA: {
    nome: "Mesa Diretora",
    descricao:
      "Órgão responsável pela direção dos trabalhos legislativos e administrativos da Câmara dos Deputados.",
  },

  PLEN: {
    nome: "Plenário",
    descricao:
      "Espaço e instância em que os deputados se reúnem para discutir e votar matérias legislativas.",
  },

  PLENARIO: {
    nome: "Plenário",
    descricao:
      "Instância em que os deputados se reúnem para discutir e votar matérias legislativas.",
  },

  TRAMITE: {
    nome: "Trâmite",
    descricao:
      "Conjunto de etapas e procedimentos que uma proposição percorre durante sua tramitação no Legislativo.",
  },

  MERITO: {
    nome: "Mérito",
    descricao:
      "Conteúdo principal de uma proposição. Uma discussão de mérito analisa a matéria em si, e não apenas questões de procedimento ou tramitação.",
  },

  ATIVIDADE_PARLAMENTAR: {
    nome: "Atividade Parlamentar",
    descricao:
      "Conjunto de atividades realizadas pelo parlamentar no exercício do mandato, incluindo participação em sessões, votações, comissões e outras funções legislativas.",
  },

  LEGISLATURA: {
    nome: "Legislatura",
    descricao:
      "Período de quatro anos correspondente ao mandato dos deputados federais e que se inicia com a posse dos parlamentares eleitos.",
  },

  // ============================================================
  // COMISSÕES
  // ============================================================

  CCJ: {
    nome: "Comissão de Constituição e Justiça",
    descricao:
      "Comissão que analisa, entre outros aspectos, a constitucionalidade, juridicidade e técnica legislativa das proposições.",
  },

  CFT: {
    nome: "Comissão de Finanças e Tributação",
    descricao:
      "Comissão que analisa aspectos financeiros, orçamentários e tributários das proposições.",
  },

  CLP: {
    nome: "Comissão de Legislação Participativa",
    descricao:
      "Comissão que recebe e analisa sugestões apresentadas por entidades da sociedade civil.",
  },

  CMULHER: {
    nome: "Comissão de Defesa dos Direitos da Mulher",
    descricao:
      "Comissão que analisa matérias relacionadas aos direitos e à proteção das mulheres.",
  },

  CDHM: {
    nome: "Comissão de Direitos Humanos e Minorias",
    descricao:
      "Comissão que analisa matérias relacionadas aos direitos humanos e às minorias.",
  },

  CAPADR: {
    nome: "Comissão de Agricultura e Reforma Agrária",
    descricao:
      "Comissão que analisa matérias relacionadas à agricultura, pecuária, abastecimento e desenvolvimento rural.",
  },

  CMEIO: {
    nome: "Comissão de Meio Ambiente",
    descricao:
      "Comissão que analisa matérias relacionadas ao meio ambiente, desenvolvimento sustentável e recursos naturais.",
  },

  CEC: {
    nome: "Comissão de Educação",
    descricao:
      "Comissão que analisa matérias relacionadas à educação, cultura, esporte, ciência e tecnologia.",
  },

  CSPCCO: {
    nome: "Comissão de Segurança Pública",
    descricao:
      "Comissão que analisa matérias relacionadas à segurança pública, combate ao crime e sistema penitenciário.",
  },

  CSSF: {
    nome: "Comissão de Seguridade Social e Família",
    descricao:
      "Comissão que analisa matérias relacionadas à saúde, previdência, assistência social e direitos da família.",
  },

  CTASP: {
    nome: "Comissão de Trabalho e Serviço Público",
    descricao:
      "Comissão que analisa matérias relacionadas ao trabalho, emprego e serviço público.",
  },

  CINDRA: {
    nome: "Comissão de Integração Nacional",
    descricao:
      "Comissão que analisa matérias relacionadas ao desenvolvimento regional e à integração nacional.",
  },

  CME: {
    nome: "Comissão de Minas e Energia",
    descricao:
      "Comissão que analisa matérias relacionadas à mineração, energia, petróleo e recursos energéticos.",
  },

  CCOM: {
    nome: "Comissão de Comunicação",
    descricao:
      "Comissão que analisa matérias relacionadas à comunicação, rádio, televisão e telecomunicações.",
  },

  // ============================================================
  // ÓRGÃOS E ESTRUTURAS INSTITUCIONAIS
  // ============================================================

  CN: {
    nome: "Congresso Nacional",
    descricao:
      "Órgão do Poder Legislativo federal formado pela Câmara dos Deputados e pelo Senado Federal.",
  },

  SGM: {
    nome: "Secretaria-Geral da Mesa",
    descricao:
      "Órgão da Câmara dos Deputados responsável por atividades relacionadas à organização e ao registro dos trabalhos legislativos.",
  },

  // ============================================================
  // PARTIDOS E BANCADAS
  // ============================================================

  MEMBROS_PARTIDO: {
    nome: "Membros de um partido na Câmara",
    descricao:
      "Deputados federais que integram determinado partido político durante a legislatura.",
  },

  REPRESENTATIVIDADE: {
    nome: "Representatividade",
    descricao:
      "Participação de um partido no total de cadeiras da Câmara dos Deputados. A Câmara possui 513 cadeiras.",
  },

  VOTACOES_BANCADA: {
    nome: "Votações da bancada",
    descricao:
      "Registro dos votos dos membros de determinado partido em uma votação. Os parlamentares de uma mesma bancada podem votar de forma igual ou diferente.",
  },

  GASTOS_BANCADA: {
    nome: "Gastos da bancada",
    descricao:
      "Despesas relacionadas à estrutura e ao funcionamento da liderança ou bancada partidária, conforme os dados oficiais disponibilizados.",
  },

  REQUERIMENTOS_AUTORIA: {
    nome: "Requerimentos de autoria",
    descricao:
      "Requerimentos apresentados formalmente por determinado parlamentar como autor da matéria.",
  },

  LIDER_PARTIDO: {
    nome: "Líder de partido na Câmara",
    descricao:
      "Deputado escolhido para representar o partido ou bloco parlamentar na Câmara e exercer funções de liderança.",
  },

  PRESIDENTE_PARTIDO: {
    nome: "Presidente de partido",
    descricao:
      "Dirigente responsável pela presidência de uma organização partidária, conforme suas regras internas.",
  },

  // ============================================================
  // DADOS ELEITORAIS E FINANCEIROS
  // ============================================================

  PATRIMONIO_DECLARADO: {
    nome: "Patrimônio declarado",
    descricao:
      "Conjunto de bens e valores declarados pelo candidato à Justiça Eleitoral no registro de candidatura.",
  },

  GASTO_CEAP: {
    nome: "Gasto CEAP",
    descricao:
      "Despesa registrada na Cota para o Exercício da Atividade Parlamentar, utilizada para custear despesas relacionadas ao exercício do mandato.",
  },

  TSE: {
    nome: "Tribunal Superior Eleitoral",
    descricao:
      "Órgão máximo da Justiça Eleitoral brasileira, responsável por coordenar e administrar as eleições em âmbito nacional.",
  },
};

export function getGlossarioInfo(
  termo: string
): GlossarioInfo | undefined {
  return GLOSSARIO[termo.trim().toUpperCase()];
}