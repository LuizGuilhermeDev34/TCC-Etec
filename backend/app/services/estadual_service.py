"""
Serviço para Deputados Estaduais.
Fonte: dados estáticos da ALESP (mandato 2023-2027) — a ALESP não oferece API REST.
Estrutura pronta para expansão a outros estados e vereadores.
"""
import asyncio
import dataclasses
from typing import List, Optional

from ..models.deputado_estadual import DeputadoEstadual
from .wikipedia_service import get_summary

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
        biografia="Ex-policial e servidor público, deputado estadual pelo PL. Defensor das forças de segurança e das pautas conservadoras no parlamento estadual paulista.",
    ),
    DeputadoEstadual(
        id=1015, nome="Frederico D'Avila", partido="PL", uf="SP",
        url_pagina="https://www.al.sp.gov.br/deputado/?perfil=15",
        biografia="Veterinário e produtor rural, deputado estadual pelo PL. Alinhado às pautas do agronegócio e do conservadorismo, com forte base eleitoral no interior paulista.",
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

_INDEX: dict[int, DeputadoEstadual] = {d.id: d for d in _SP_DEPUTADOS}


async def _enrich(dep: DeputadoEstadual) -> DeputadoEstadual:
    """Adds url_foto from Wikipedia if not already set."""
    if dep.url_foto:
        return dep
    title = _WIKI_TITLE.get(dep.id)
    if not title:
        return dep
    summary = await get_summary(title)
    if summary and summary.get("thumbnail"):
        return dataclasses.replace(dep, url_foto=summary["thumbnail"])
    return dep


async def get_deputados_estaduais(uf: str = "SP") -> List[DeputadoEstadual]:
    uf = uf.upper()
    if uf != "SP":
        return []
    enriched = await asyncio.gather(*(_enrich(d) for d in _SP_DEPUTADOS))
    return sorted(enriched, key=lambda d: d.nome)


async def get_deputado_estadual_by_id(deputado_id: int) -> Optional[DeputadoEstadual]:
    dep = _INDEX.get(deputado_id)
    if dep is None:
        return None
    return await _enrich(dep)
