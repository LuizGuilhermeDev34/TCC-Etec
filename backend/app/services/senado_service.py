import xml.etree.ElementTree as ET
from typing import List, Optional

import httpx

from ..core import SimpleCache
from ..models.senador import Senador
from ..models.deputado_votacao import DeputadoVotacao  # reuse for senator votes

_cache = SimpleCache()
_SENADO_BASE = "https://legis.senado.leg.br/dadosabertos"


def _text(elem: ET.Element, tag: str) -> str:
    node = elem.find(tag)
    return node.text.strip() if node is not None and node.text else ""


def _parse_senador(elem: ET.Element) -> Senador:
    ident = elem.find("IdentificacaoParlamentar")
    if ident is None:
        return Senador(codigo="", nome="", nome_completo="", sexo="", partido="", uf="")

    return Senador(
        codigo=_text(ident, "CodigoParlamentar"),
        nome=_text(ident, "NomeParlamentar"),
        nome_completo=_text(ident, "NomeCompletoParlamentar"),
        sexo=_text(ident, "SexoParlamentar"),
        partido=_text(ident, "SiglaPartidoParlamentar"),
        uf=_text(ident, "UfParlamentar"),
        url_foto=_text(ident, "UrlFotoParlamentar") or None,
        url_pagina=_text(ident, "UrlPaginaParlamentar") or None,
        email=_text(ident, "EmailParlamentar") or None,
    )


async def get_senadores() -> List[Senador]:
    cache_key = "senadores_atual"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    url = f"{_SENADO_BASE}/senador/lista/atual"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        root = ET.fromstring(response.text)

    parlamentares = root.findall(".//Parlamentar")
    senadores = [_parse_senador(p) for p in parlamentares]
    senadores = [s for s in senadores if s.codigo]
    _cache.set(cache_key, senadores)
    return senadores


async def get_senador_votacoes(codigo: str, data_inicio: Optional[str] = None) -> List[DeputadoVotacao]:
    """Fetch a senator's voting records from the Senado API (XML)."""
    cache_key = f"sen_votacoes:{codigo}:{data_inicio}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    params: dict = {"dataInicio": data_inicio or "2026-01-01"}
    url = f"{_SENADO_BASE}/senador/{codigo}/votacoes"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            root = ET.fromstring(response.text)
    except Exception:
        return []

    votacoes: List[DeputadoVotacao] = []
    for v in root.findall(".//Votacao"):
        # vote type
        tipo = (
            _text(v, "SiglaDescricaoVoto")
            or _text(v, "DescricaoVoto")
            or ""
        )
        # normalise to Sim/Não/Abstenção
        tipo_map = {
            "sim": "Sim", "favorável": "Sim", "a favor": "Sim",
            "não": "Não", "contra": "Não",
            "abstenção": "Abstenção", "abstencao": "Abstenção",
            "obstrução": "Obstrução",
        }
        tipo_norm = tipo_map.get(tipo.lower(), tipo)

        sessao = v.find("SessaoPlenaria")
        data = _text(sessao, "DataSessao") if sessao is not None else ""
        sigla_orgao = _text(sessao, "SiglaCasaSessao") if sessao is not None else "SF"

        materia = v.find("Materia")
        sigla = _text(materia, "Sigla") if materia is not None else None
        numero_str = _text(materia, "Numero") if materia is not None else None
        ano_str = _text(materia, "Ano") if materia is not None else None
        ementa = _text(materia, "Ementa") if materia is not None else None
        id_curta = _text(materia, "DescricaoIdentificacao") if materia is not None else None

        # Secret ballot: individual vote direction is unknown
        secreto = _text(v, "IndicadorVotacaoSecreta").lower() == "sim"
        if secreto and tipo_norm not in ("Sim", "Não", "Abstenção"):
            tipo_norm = "Voto Secreto"

        votacoes.append(DeputadoVotacao(
            id=f"sen-{codigo}-{data}-{len(votacoes)}",
            data=data,
            sigla_orgao=sigla_orgao,
            tipo_voto=tipo_norm,
            proposicao_sigla=sigla or None,
            proposicao_numero=int(numero_str) if numero_str and numero_str.isdigit() else None,
            proposicao_ano=int(ano_str) if ano_str and ano_str.isdigit() else None,
            proposicao_ementa=ementa or id_curta or None,
        ))

    _cache.set(cache_key, votacoes)
    return votacoes
