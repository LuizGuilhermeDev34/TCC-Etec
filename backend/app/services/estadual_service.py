
import asyncio
import dataclasses
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx

from ..models.deputado_estadual import DeputadoEstadual
from .wikipedia_service import get_summary


# ---------------------------------------------------------------------------
# FONTE DE DESPESAS DA ALESP
# ---------------------------------------------------------------------------

_ALESP_DESPESAS_URL = (
    "https://www3.al.sp.gov.br/repositorio/"
    "dados-abertos/output/json/despesas_gabinetes.json"
)

# Cache em memória para evitar baixar o JSON enorme a cada requisição.
# 6 horas é suficiente porque os dados da ALESP são atualizados diariamente.
_despesas_cache: Optional[List[Dict[str, Any]]] = None
_despesas_cache_timestamp: float = 0.0
_DESPESAS_CACHE_TTL = 60 * 60 * 6


@dataclass
class DeputadoEstadualDespesa:
    """Representa uma despesa individual de deputado estadual."""

    ano: int
    mes: int
    categoria_id: int
    valor: float
    matricula: int
    deputado: str
    tipo: str
    fornecedor: str
    cnpj: Optional[str] = None


async def _load_despesas_alesp() -> List[Dict[str, Any]]:
    """
    Baixa e carrega as despesas de gabinete da ALESP.

    O arquivo oficial contém registros de diversos deputados e anos.
    O resultado é mantido em cache para evitar downloads repetidos.
    """
    global _despesas_cache, _despesas_cache_timestamp

    import time

    agora = time.time()

    if (
        _despesas_cache is not None
        and agora - _despesas_cache_timestamp < _DESPESAS_CACHE_TTL
    ):
        return _despesas_cache

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        response = await client.get(_ALESP_DESPESAS_URL)
        response.raise_for_status()
        dados = response.json()

    if not isinstance(dados, list):
        raise ValueError("Formato inesperado nos dados de despesas da ALESP")

    _despesas_cache = dados
    _despesas_cache_timestamp = agora

    return dados


async def get_deputado_estadual_despesas(
    deputado_id: int,
    ano: int = 2026,
) -> List[DeputadoEstadualDespesa]:
    """
    Retorna as despesas individuais de um deputado estadual.

    O projeto utiliza IDs internos (1001, 1002, etc.), enquanto a ALESP
    identifica seus deputados pela matrícula. Por isso, primeiro localizamos
    o deputado no cadastro interno e depois usamos o nome para encontrar
    a matrícula oficial correspondente na base de despesas.

    Args:
        deputado_id: ID interno do deputado no projeto.
        ano: Ano das despesas desejado.

    Returns:
        Lista de despesas individuais do deputado.
    """

    dep = _INDEX.get(deputado_id)

    if dep is None:
        return []

    dados = await _load_despesas_alesp()

    nome_deputado = dep.nome.strip().casefold()

    # Primeiro descobrimos a matrícula oficial da ALESP.
    matriculas: set[int] = set()

    for item in dados:
        if not isinstance(item, dict):
            continue

        nome = str(item.get("deputado") or "").strip().casefold()

        if nome == nome_deputado:
            matricula = item.get("matricula")

            try:
                matriculas.add(int(matricula))
            except (TypeError, ValueError):
                continue

    if not matriculas:
        return []

    # Agora filtramos somente:
    # - o ano solicitado
    # - a matrícula oficial do deputado
    despesas: List[DeputadoEstadualDespesa] = []

    # A fonte da ALESP apresenta alguns registros exatamente duplicados.
    # Guardamos uma chave dos campos disponíveis para impedir que eles
    # sejam somados duas ou mais vezes.
    registros_vistos: set[tuple] = set()

    for item in dados:
        if not isinstance(item, dict):
            continue

        try:
            item_ano = int(item.get("ano"))
            matricula = int(item.get("matricula"))
        except (TypeError, ValueError):
            continue

        if item_ano != ano:
            continue

        if matricula not in matriculas:
            continue

        try:
            mes = int(item.get("mes") or 0)
            categoria_id = int(item.get("id") or 0)
            valor = float(item.get("valor") or 0)
        except (TypeError, ValueError):
            continue

        cnpj = item.get("cnpj")
        if cnpj is not None:
            cnpj = str(cnpj).strip()

        deputado = str(item.get("deputado") or dep.nome).strip()
        tipo = str(item.get("tipo") or "").strip()
        fornecedor = str(item.get("fornecedor") or "").strip()

        # Chave para eliminar somente duplicações exatas da fonte.
        chave = (
            item_ano,
            mes,
            categoria_id,
            matricula,
            valor,
            cnpj,
            deputado,
            tipo,
            fornecedor,
        )

        if chave in registros_vistos:
            continue

        registros_vistos.add(chave)

        despesas.append(
            DeputadoEstadualDespesa(
                ano=item_ano,
                mes=mes,
                categoria_id=categoria_id,
                valor=valor,
                matricula=matricula,
                deputado=deputado,
                tipo=tipo,
                fornecedor=fornecedor,
                cnpj=cnpj,
            )
        )

    # Ordena da despesa mais recente para a mais antiga.
    despesas.sort(
        key=lambda d: (
            d.ano,
            d.mes,
            d.valor,
        ),
        reverse=True,
    )

    return despesas


async def get_deputado_estadual_gastos_total(
    deputado_id: int,
    ano: int = 2026,
) -> float:
    """Retorna somente o total gasto pelo deputado no ano informado."""

    despesas = await get_deputado_estadual_despesas(
        deputado_id=deputado_id,
        ano=ano,
    )

    return sum(
        despesa.valor
        for despesa in despesas
        if despesa.valor > 0
    )


# ---------------------------------------------------------------------------
# DADOS DOS DEPUTADOS
# ---------------------------------------------------------------------------

# Wikipedia article title for each deputy (keyed by id).
# Deputies without a known article are omitted — their url_foto stays None.
_WIKI_TITLE: dict[int, str] = {
    # 1001 André do Prado: artigo existe mas thumbnail é imagem de assinatura, não retrato
    1002: "Douglas Garcia",
    1003: "Carlos Giannazi",
    1004: "Rui Falcão",
    1005: "Márcia Lia",
    1006: "Teonilio Barba",
    # 1007 Simão Pedro: artigo da Wikipédia é do apóstolo, não do deputado
    1008: "Coronel Nishikawa",
    1009: "Márcio Labre",
    1010: "Letícia Aguiar",
    1011: "Samuel Moreira",
    1012: "Barros Munhoz",
    1013: "Rodrigo Gambale",
    1014: "Gil Diniz",
    1015: "Frederico D'Avila",
    # 1016 Jorge Wilson: sem artigo com foto
    1017: "Dimas Ramalho",
    1018: "Emídio de Souza",
    1019: "Luiz Fernando Teixeira",
    1020: "Ana Carolina Serra",
}


_SP_DEPUTADOS: List[DeputadoEstadual] = [
    DeputadoEstadual(
        id=1001, nome="André do Prado", partido="PL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=1",
        biografia="Advogado e empresário, deputado estadual desde 2011. Eleito presidente da ALESP para o biênio 2023-2024. É um dos líderes do PL na Assembleia Legislativa de São Paulo.",
    ),
    DeputadoEstadual(
        id=1002, nome="Douglas Garcia", partido="Republicanos", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=2",
        biografia="Mestre em ciência política pela USP, deputado estadual desde 2018. Ficou conhecido por declarações polêmicas e conflitos com a imprensa. Reeleito em 2022 pelo Republicanos.",
    ),
    DeputadoEstadual(
        id=1003, nome="Carlos Giannazi", partido="PSOL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=3",
        biografia="Professor universitário e um dos fundadores do PSOL em São Paulo. Deputado estadual desde 2011, é referência histórica da esquerda na ALESP. Defende pautas de direitos humanos e educação pública.",
    ),
    DeputadoEstadual(
        id=1004, nome="Rui Falcão", partido="PT", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=4",
        biografia="Jornalista e político veterano do PT. Foi presidente nacional do Partido dos Trabalhadores de 2012 a 2017. Eleito deputado estadual por São Paulo em 2022, voltando ao mandato eletivo após anos na direção partidária.",
    ),
    DeputadoEstadual(
        id=1005, nome="Marcia Lia", partido="PT", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=5",
        biografia="Professora e sindicalista, deputada estadual reeleita pelo PT. Atuação focada em educação pública, saúde e direitos trabalhistas. Líder do PT na Assembleia Legislativa paulista.",
    ),
    DeputadoEstadual(
        id=1006, nome="Teonilio Barba", partido="PT", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=6",
        biografia="Trabalhador rural e sindicalista, deputado estadual pelo PT. Defende pautas do campo, reforma agrária e agricultores familiares. Reeleito em 2022.",
    ),
    DeputadoEstadual(
        id=1007, nome="Simão Pedro", partido="PT", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=7",
        biografia="Metalúrgico com trajetória no sindicalismo do Grande ABC paulista. Deputado estadual pelo PT, com atuação voltada para direitos trabalhistas e políticas industriais.",
    ),
    DeputadoEstadual(
        id=1008, nome="Coronel Nishikawa", partido="PL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=8",
        biografia="Policial militar reformado com a patente de coronel. Deputado estadual pelo PL, com atuação na área de segurança pública e defesa das forças policiais.",
    ),
    DeputadoEstadual(
        id=1009, nome="Márcio Labre", partido="PL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=9",
        biografia="Militar reformado, ex-policial legislativo federal. Deputado estadual pelo PL, alinhado à pauta conservadora e de segurança pública.",
    ),
    DeputadoEstadual(
        id=1010, nome="Letícia Aguiar", partido="PL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=10",
        biografia="Advogada, eleita deputada estadual pelo PL em 2022. Integra a bancada conservadora da ALESP e tem atuação nas comissões de justiça e direitos humanos.",
    ),
    DeputadoEstadual(
        id=1011, nome="Samuel Moreira", partido="PSDB", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=11",
        biografia="Advogado e político tucano histórico. Deputado estadual com longa trajetória no PSDB paulista. Já foi candidato ao governo do Estado e lidera a bancada do PSDB na ALESP.",
    ),
    DeputadoEstadual(
        id=1012, nome="Barros Munhoz", partido="PSDB", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=12",
        biografia="Agricultor e empresário rural, deputado estadual pelo PSDB. Atuação focada em agronegócio, infraestrutura e desenvolvimento regional do interior paulista.",
    ),
    DeputadoEstadual(
        id=1013, nome="Rodrigo Gambale", partido="Podemos", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=13",
        biografia="Empresário e deputado estadual pelo Podemos. Com perfil liberal, atua nas pautas de empreendedorismo, desburocratização e segurança pública.",
    ),
    DeputadoEstadual(
        id=1014, nome="Gil Diniz", partido="PL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=14",
        biografia="Ex-policial e servidor público, deputado estadual pelo PL. Defensor das forças de segurança e das pautas conservadoras no parlamento.",
    ),
    DeputadoEstadual(
        id=1015, nome="Frederico D'Avila", partido="PL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=15",
        biografia="Veterinário e produtor rural, deputado estadual pelo PL. Alinhado às pautas do agronegócio e do conservadorismo, com forte base eleitoral no interior de São Paulo.",
    ),
    DeputadoEstadual(
        id=1016, nome="Jorge Wilson", partido="Republicanos", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=16",
        biografia="Advogado e ativista de defesa do consumidor, conhecido como 'Xerife do Consumidor'. Deputado estadual pelo Republicanos, especializado em direito do consumidor e combate a fraudes.",
    ),
    DeputadoEstadual(
        id=1017, nome="Dimas Ramalho", partido="PSD", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=17",
        biografia="Médico e político veterano, deputado estadual com longa trajetória no PSD. Atua nas comissões de saúde e tem base eleitoral consolidada no interior de São Paulo.",
    ),
    DeputadoEstadual(
        id=1018, nome="Emídio de Souza", partido="PT", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=18",
        biografia="Sindicalista e deputado estadual histórico do PT em São Paulo. Com décadas de atuação na política paulista, defende pautas de trabalhadores e serviços públicos.",
    ),
    DeputadoEstadual(
        id=1019, nome="Luiz Fernando Teixeira", partido="PT", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=19",
        biografia="Professor e deputado estadual pelo PT, com base no Grande ABC paulista. Atua em políticas de educação, transporte e desenvolvimento regional.",
    ),
    DeputadoEstadual(
        id=1020, nome="Ana Carolina Serra", partido="Cidadania", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=20",
        biografia="Advogada e ativista, deputada estadual pelo Cidadania. Atuação focada em direitos das mulheres, políticas públicas sociais e meio ambiente.",
    ),
]


_INDEX: dict[int, DeputadoEstadual] = {
    d.id: d for d in _SP_DEPUTADOS
}


async def _enrich(dep: DeputadoEstadual) -> DeputadoEstadual:
    """Adds url_foto from Wikipedia if not already set."""
    if dep.url_foto:
        return dep

    title = _WIKI_TITLE.get(dep.id)

    if not title:
        return dep

    summary = await get_summary(title)

    if summary and summary.get("thumbnail"):
        return dataclasses.replace(
            dep,
            url_foto=summary["thumbnail"],
        )

    return dep


async def get_deputados_estaduais(
    uf: str = "SP",
) -> List[DeputadoEstadual]:
    uf = uf.upper()

    if uf != "SP":
        return []

    enriched = await asyncio.gather(
        *(_enrich(d) for d in _SP_DEPUTADOS)
    )

    return sorted(
        enriched,
        key=lambda d: d.nome,
    )


async def get_deputado_estadual_by_id(
    deputado_id: int,
) -> Optional[DeputadoEstadual]:

    dep = _INDEX.get(deputado_id)

    if dep is None:
        return None

    return await _enrich(dep)
