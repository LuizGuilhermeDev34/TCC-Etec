import asyncio
from typing import Any, Dict, List, Optional

import httpx

from ..core import SimpleCache
from .wikipedia_service import get_bio as get_wikipedia_bio, get_summary, get_pageviews
from ..models.deputado import Deputado
from ..models.deputado_despesa import DeputadoDespesa
from ..models.deputado_detail import DeputadoDetail, GabineteInfo
from ..models.deputado_votacao import DeputadoVotacao
from ..models.proposicao import Proposicao
from ..models.votacao import Votacao

_cache = SimpleCache()
_cache_live = SimpleCache(ttl_seconds=120)  # 2 min para dados que mudam com frequência
_CAMARA_BASE = "https://dadosabertos.camara.leg.br/api/v2"

# Presidentes nacionais dos partidos (não expostos via API da Câmara)
_PARTY_PRESIDENTS: Dict[str, Dict[str, str]] = {
    "PT":           {"nome": "Gleisi Hoffmann",     "wiki": "Gleisi_Hoffmann"},
    "PL":           {"nome": "Valdemar Costa Neto", "wiki": "Valdemar_Costa_Neto"},
    "MDB":          {"nome": "Baleia Rossi",         "wiki": "Baleia_Rossi"},
    "UNIÃO":        {"nome": "Antonio Rueda",        "wiki": "Antonio_Rueda"},
    "PSD":          {"nome": "Gilberto Kassab",      "wiki": "Gilberto_Kassab"},
    "PDT":          {"nome": "Ciro Gomes",           "wiki": "Ciro_Gomes"},
    "PSOL":         {"nome": "Juliano Medeiros",     "wiki": "Juliano_Medeiros"},
    "REPUBLICANOS": {"nome": "Marcos Pereira",       "wiki": "Marcos_Pereira_Gadelha"},
    "PP":           {"nome": "Cláudio Cajado",       "wiki": "Cláudio_Cajado"},
    "PODE":         {"nome": "Renata Abreu",         "wiki": "Renata_Abreu"},
    "PSB":          {"nome": "Carlos Siqueira",      "wiki": "Carlos_Siqueira"},
    "AVANTE":       {"nome": "Luís Tibé",            "wiki": "Luís_Tibé"},
    "CIDADANIA":    {"nome": "Roberto Freire",       "wiki": "Roberto_Freire"},
    "NOVO":         {"nome": "Eduardo Ribeiro",      "wiki": "Eduardo_Ribeiro_(político)"},
    "PRD":          {"nome": "Sérgio Queiroz",       "wiki": "Sérgio_Queiroz_(político)"},
    "SOLIDARIEDADE":{"nome": "Paulinho da Força",    "wiki": "Paulinho_da_Força"},
    "PV":           {"nome": "José Luiz Penna",      "wiki": "José_Luiz_Penna"},
    "PCdoB":        {"nome": "Luciana Santos",       "wiki": "Luciana_Santos"},
    "PSDB":         {"nome": "Marconi Perillo",      "wiki": "Marconi_Perillo"},
    "REDE":         {"nome": "Alessandro Molon",     "wiki": "Alessandro_Molon"},
    "MISSÃO":       {"nome": "Kim Kataguiri",        "wiki": "Kim_Kataguiri"},
}

# Fallback logos for parties whose Câmara GIFs return 404
_LOGO_FALLBACK: Dict[str, str] = {
    "PL":           "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Partido_Liberal_%28Brazil%29_logo.svg/langpt-330px-Partido_Liberal_%28Brazil%29_logo.svg.png",
    "MDB":          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Logo_do_MDB_1965-1979.svg/langpt-330px-Logo_do_MDB_1965-1979.svg.png",
    "REPUBLICANOS": "https://upload.wikimedia.org/wikipedia/pt/thumb/0/0d/Republicanos_logo.png/330px-Republicanos_logo.png",
    "UNIÃO":        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Uni%C3%A3o_Brasil_logo.svg/langpt-330px-Uni%C3%A3o_Brasil_logo.svg.png",
    "CIDADANIA":    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Logo_do_Cidadania_23.png/330px-Logo_do_Cidadania_23.png",
    "PODE":         "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Podemos_%28Brasil%29_logo.svg/langpt-330px-Podemos_%28Brasil%29_logo.svg.png",
    "NOVO":         "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Partido_Novo_logo_%282023%29.svg/langpt-330px-Partido_Novo_logo_%282023%29.svg.png",
    "SOLIDARIEDADE":"https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Solidariedade_77_%28Brasil%29_logo.svg/langpt-330px-Solidariedade_77_%28Brasil%29_logo.svg.png",
    "PRD":          "https://upload.wikimedia.org/wikipedia/commons/b/ba/Partido_da_Renova%C3%A7%C3%A3o_Democr%C3%A1tica.jpg",
    "MISSÃO":       "https://upload.wikimedia.org/wikipedia/pt/thumb/4/47/MISS%C3%83O_logo.png/330px-MISS%C3%83O_logo.png",
}


async def _fetch_camara_json(path: str, params: Dict[str, Any] | None = None) -> Any:
    url = f"{_CAMARA_BASE}{path}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()


def _to_deputado(data: Dict[str, Any]) -> Deputado:
    return Deputado(
        id=int(data.get("id", 0)),
        nome=data.get("nome", ""),
        sigla_partido=data.get("siglaPartido", ""),
        sigla_uf=data.get("siglaUf", ""),
        id_legislatura=int(data.get("idLegislatura", 57)),
        url_foto=data.get("urlFoto"),
        email=data.get("email"),
    )


def _to_proposicao(data: Dict[str, Any]) -> Proposicao:
    return Proposicao(
        id=int(data.get("id", 0)),
        sigla_tipo=data.get("siglaTipo", ""),
        numero=int(data.get("numero", 0)),
        ano=int(data.get("ano", 0)),
        ementa=data.get("ementa", ""),
        data_apresentacao=data.get("dataApresentacao"),
        url_inteiro_teor=data.get("urlInteiroTeor"),
    )


async def get_deputados(legislatura: int = 57) -> List[Deputado]:
    cache_key = f"deputados:{legislatura}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    payload = await _fetch_camara_json(
        "/deputados",
        params={"idLegislatura": legislatura, "itens": 513},
    )
    items = payload.get("dados", [])
    deputados = sorted([_to_deputado(item) for item in items], key=lambda d: d.nome)
    _cache.set(cache_key, deputados)
    return deputados


def _parse_partido(data: Dict[str, Any]) -> Dict[str, Any]:
    status = data.get("status", {})
    lider_raw = status.get("lider") or {}
    lider = {
        "nome": lider_raw.get("nome"),
        "urlFoto": lider_raw.get("urlFoto"),
        "uf": lider_raw.get("uf"),
        "uri": lider_raw.get("uri"),
    } if lider_raw.get("nome") else None
    sigla = data.get("sigla", "")
    url_logo = _LOGO_FALLBACK.get(sigla) or data.get("urlLogo")
    return {
        "id": data.get("id"),
        "sigla": sigla,
        "nome": data.get("nome", ""),
        "uri": data.get("uri"),
        "urlLogo": url_logo,
        "urlWebSite": data.get("urlWebSite"),
        "urlFacebook": data.get("urlFacebook"),
        "totalMembros": int(status.get("totalMembros") or 0),
        "totalPosse": int(status.get("totalPosse") or 0),
        "situacao": status.get("situacao", ""),
        "lider": lider,
    }


async def _fetch_partido_detail(client: httpx.AsyncClient, partido_id: int) -> Dict[str, Any]:
    try:
        resp = await client.get(f"/partidos/{partido_id}", timeout=10.0)
        if not resp.is_success:
            return {}
        return _parse_partido(resp.json().get("dados", {}))
    except Exception:
        return {}


async def get_partido_by_id(partido_id: int) -> Optional[Dict[str, Any]]:
    # Tenta achar no cache da lista completa primeiro
    cached_list = _cache.get("partidos_camara")
    if cached_list:
        for p in cached_list:
            if p.get("id") == partido_id:
                return p
    # Fallback: busca direto
    payload = await _fetch_camara_json(f"/partidos/{partido_id}")
    data = payload.get("dados")
    if not data:
        return None
    return _parse_partido(data)


def _partido_fallback(item: Dict[str, Any]) -> Dict[str, Any]:
    """Monta entrada mínima usando só o dado da lista (sem detalhe)."""
    sigla = item.get("sigla", "")
    return {
        "id": item.get("id"),
        "sigla": sigla,
        "nome": item.get("nome", ""),
        "uri": item.get("uri"),
        "urlLogo": _LOGO_FALLBACK.get(sigla) or item.get("urlLogo"),
        "urlWebSite": None,
        "urlFacebook": None,
        "totalMembros": 0,
        "totalPosse": 0,
        "situacao": "",
        "lider": None,
    }


async def get_partidos() -> List[Dict[str, Any]]:
    cache_key = "partidos_camara"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    payload = await _fetch_camara_json(
        "/partidos",
        params={"itens": 100, "ordem": "ASC", "ordenarPor": "sigla"},
    )
    items = payload.get("dados", [])

    # Fetch details in batches of 5 to avoid rate limiting
    all_details: list = []
    async with httpx.AsyncClient(base_url=_CAMARA_BASE, timeout=12.0) as client:
        batch_size = 5
        for i in range(0, len(items), batch_size):
            batch = items[i : i + batch_size]
            batch_results = await asyncio.gather(
                *[_fetch_partido_detail(client, item["id"]) for item in batch],
                return_exceptions=True,
            )
            all_details.extend(batch_results)
            if i + batch_size < len(items):
                await asyncio.sleep(0.4)

    enriched = []
    for item, detail in zip(items, all_details):
        if isinstance(detail, dict) and detail.get("sigla"):
            enriched.append(detail)
        elif item.get("sigla"):
            enriched.append(_partido_fallback(item))

    _cache.set(cache_key, enriched)
    return enriched


async def get_deputado_proposicoes(deputado_id: int) -> List[Proposicao]:
    cache_key = f"dep_proposicoes:{deputado_id}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    payload = await _fetch_camara_json(
        "/proposicoes",
        params={
            "idDeputadoAutor": deputado_id,
            "itens": 100,
            "ordem": "DESC",
            "ordenarPor": "ano",
        },
    )
    items = payload.get("dados", [])
    # Primary sort: newest date first. Secondary: type importance (PL > PEC > PDC > MPV > others).
    _TIPO_PRIORITY = {"PL": 1, "PEC": 2, "PDC": 3, "MPV": 4, "REQ": 5, "INC": 6}
    proposicoes = sorted(
        [_to_proposicao(item) for item in items],
        key=lambda p: (p.ano, p.data_apresentacao or "", -_TIPO_PRIORITY.get(p.sigla_tipo, 99)),
        reverse=True,
    )
    _cache.set(cache_key, proposicoes)
    return proposicoes


async def _fetch_proposicao_status(
    client: httpx.AsyncClient,
    prop_id: int,
) -> tuple[int, Optional[str], Optional[str]]:
    try:
        resp = await client.get(f"{_CAMARA_BASE}/proposicoes/{prop_id}", timeout=10.0)
        if not resp.is_success:
            return prop_id, None, None
        dados = resp.json().get("dados", {})
        status = dados.get("statusProposicao") or {}
        # descricaoSituacao is null for some proposals (e.g. MPVs mid-prorrogação);
        # fall back to descricaoTramitacao which is usually populated.
        descricao = (
            status.get("descricaoSituacao")
            or status.get("descricaoTramitacao")
            or None
        )
        return (
            prop_id,
            descricao,
            status.get("siglaOrgao") or None,
        )
    except Exception:
        return prop_id, None, None


async def get_proposicoes(ano: int = 2026, tipo: str = "", itens: int = 20) -> List[Proposicao]:
    cache_key = f"proposicoes:{ano}:{tipo}:{itens}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    params: Dict[str, Any] = {"ano": ano, "itens": itens, "ordem": "DESC", "ordenarPor": "id"}
    if tipo:
        params["siglaTipo"] = tipo

    payload = await _fetch_camara_json("/proposicoes", params=params)
    items = payload.get("dados", [])
    proposicoes = [_to_proposicao(item) for item in items]

    # Enrich each proposition with its current status (batched to avoid rate limits)
    id_to_prop = {p.id: p for p in proposicoes}
    batch_size = 10
    async with httpx.AsyncClient(timeout=12.0) as client:
        for i in range(0, len(proposicoes), batch_size):
            batch = proposicoes[i : i + batch_size]
            results = await asyncio.gather(
                *[_fetch_proposicao_status(client, p.id) for p in batch],
                return_exceptions=True,
            )
            for result in results:
                if isinstance(result, tuple):
                    pid, desc, orgao = result
                    if pid in id_to_prop:
                        id_to_prop[pid].descricao_situacao = desc
                        id_to_prop[pid].orgao_situacao = orgao
            if i + batch_size < len(proposicoes):
                await asyncio.sleep(0.2)

    _cache.set(cache_key, proposicoes)
    return proposicoes


def _to_votacao(data: Dict[str, Any]) -> Votacao:
    return Votacao(
        id=str(data.get("id", "")),
        data=data.get("data", ""),
        data_hora_registro=data.get("dataHoraRegistro", ""),
        sigla_orgao=data.get("siglaOrgao", ""),
        proposicao_objeto=data.get("proposicaoObjeto"),
        descricao=data.get("descricao", ""),
        aprovacao=int(data.get("aprovacao") or 0),
    )


async def get_deputado_detail(deputado_id: int) -> DeputadoDetail:
    cache_key = f"deputado_detail:{deputado_id}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    payload = await _fetch_camara_json(f"/deputados/{deputado_id}")
    data = payload.get("dados", {})
    ultimo = data.get("ultimoStatus", {})

    nome = ultimo.get("nome") or data.get("nomeCivil", "")
    nome_civil = data.get("nomeCivil", "")

    gabinete = None
    if any(ultimo.get(f"gabinete{k}") for k in ["Andar", "Predio", "Sala", "Telefone"]):
        gabinete = GabineteInfo(
            andar=ultimo.get("gabineteAndar"),
            predio=ultimo.get("gabinetePredio"),
            sala=ultimo.get("gabineteSala"),
            telefone=ultimo.get("gabineteTelefone"),
        )

    redes = data.get("redeSocial") or []
    bio = await get_wikipedia_bio(nome, nome_civil)

    detail = DeputadoDetail(
        id=int(data.get("id", deputado_id)),
        nome=nome,
        nome_civil=nome_civil,
        sigla_partido=ultimo.get("siglaPartido", ""),
        sigla_uf=ultimo.get("siglaUf", ""),
        id_legislatura=int(ultimo.get("idLegislatura", 57)),
        url_foto=ultimo.get("urlFoto"),
        email=ultimo.get("email"),
        cpf=data.get("cpf"),
        sexo=data.get("sexo"),
        data_nascimento=data.get("dataNascimento"),
        uf_nascimento=data.get("ufNascimento"),
        municipio_nascimento=data.get("municipioNascimento"),
        escolaridade=data.get("escolaridade"),
        url_website=data.get("urlWebsite"),
        redes_sociais=redes if isinstance(redes, list) else [],
        descricao_status=ultimo.get("descricaoStatus"),
        gabinete=gabinete,
        biografia=bio,
    )
    _cache.set(cache_key, detail)
    return detail


async def _fetch_deputy_vote_for_votacao(
    client: httpx.AsyncClient,
    votacao: Dict[str, Any],
    deputado_id: int,
) -> Optional[DeputadoVotacao]:
    """Return this deputy's DeputadoVotacao for a single votação, or None."""
    try:
        url = f"{_CAMARA_BASE}/votacoes/{votacao['id']}/votos"
        resp = await client.get(url, timeout=12.0)
        if not resp.is_success:
            return None
        votos = resp.json().get("dados", [])
        for voto in votos:
            dep = voto.get("deputado_") or {}
            if int(dep.get("id", 0)) == deputado_id:
                prop_str = votacao.get("proposicaoObjeto", "") or ""
                sigla = numero = ano = None
                parts = prop_str.split()
                if len(parts) >= 2:
                    sigla = parts[0]
                    rest = parts[1].split("/")
                    if len(rest) == 2:
                        try: numero = int(rest[0])
                        except: pass
                        try: ano = int(rest[1])
                        except: pass
                return DeputadoVotacao(
                    id=str(votacao.get("id", "")),
                    data=votacao.get("data", ""),
                    sigla_orgao=votacao.get("siglaOrgao", ""),
                    tipo_voto=voto.get("tipoVoto", ""),
                    proposicao_sigla=sigla,
                    proposicao_numero=numero,
                    proposicao_ano=ano,
                    proposicao_ementa=votacao.get("descricao"),
                )
    except Exception:
        return None
    return None


async def get_deputado_votacoes(deputado_id: int) -> List[DeputadoVotacao]:
    """
    Fetch voting records for a deputy by scanning plenário (PLEN) votações from 2023.
    Only plenário votes have all 513 deputies — committee votes skip absent members.
    The /votos endpoint has a multi-month publication lag, so 2023 data is used.
    """
    cache_key = f"dep_votacoes:{deputado_id}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    payload = await _fetch_camara_json(
        "/votacoes",
        params={"dataInicio": "2023-01-01", "dataFim": "2023-12-31", "itens": 100},
    )
    votacoes_list = [v for v in payload.get("dados", []) if v.get("siglaOrgao") == "PLEN"]

    results: List[DeputadoVotacao] = []
    batch_size = 10
    async with httpx.AsyncClient(timeout=15.0) as client:
        for i in range(0, len(votacoes_list), batch_size):
            batch = votacoes_list[i : i + batch_size]
            batch_results = await asyncio.gather(
                *[_fetch_deputy_vote_for_votacao(client, v, deputado_id) for v in batch]
            )
            results.extend(r for r in batch_results if r is not None)

    _cache.set(cache_key, results)
    return results


async def get_deputado_despesas(deputado_id: int, ano: int = 2025) -> List[DeputadoDespesa]:
    """Try the requested year; fall back to the previous year if empty."""
    for year in [ano, ano - 1]:
        cache_key = f"dep_despesas:{deputado_id}:{year}"
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached

        payload = await _fetch_camara_json(
            f"/deputados/{deputado_id}/despesas",
            params={"ano": year, "itens": 100},
        )
        despesas = [
            DeputadoDespesa(
                ano=int(d.get("ano", year)),
                mes=int(d.get("mes", 0)),
                tipo_despesa=d.get("tipoDespesa", ""),
                valor_liquido=float(d.get("valorLiquido") or 0),
                nome_fornecedor=d.get("nomeFornecedor", ""),
                data_documento=d.get("dataDocumento"),
                url_documento=d.get("urlDocumento"),
            )
            for d in payload.get("dados", [])
        ]
        if despesas or year == ano - 1:
            _cache.set(cache_key, despesas)
            return despesas
    return []


async def _fetch_votacao_party_stats(
    client: httpx.AsyncClient,
    votacao: Dict[str, Any],
    sigla_partido: str,
) -> Optional[Dict[str, Any]]:
    vid = votacao.get("id")
    if not vid:
        return None
    try:
        resp = await client.get(f"{_CAMARA_BASE}/votacoes/{vid}/votos", timeout=12.0)
        if not resp.is_success:
            return None
        votos = resp.json().get("dados", [])
        sim = nao = abstencao = 0
        for voto in votos:
            dep = voto.get("deputado_") or {}
            if (dep.get("siglaPartido") or "").upper() != sigla_partido.upper():
                continue
            tipo = (voto.get("tipoVoto") or "").upper()
            if tipo == "SIM":
                sim += 1
            elif tipo in ("NÃO", "NAO", "NÃO"):
                nao += 1
            else:
                abstencao += 1
        if sim + nao + abstencao == 0:
            return None
        return {
            "id": vid,
            "data": votacao.get("data", ""),
            "descricao": (votacao.get("descricao") or votacao.get("proposicaoObjeto") or "")[:120],
            "sim": sim,
            "nao": nao,
            "abstencao": abstencao,
        }
    except Exception:
        return None


async def get_partido_votacoes_stats(partido_id: int) -> Dict[str, Any]:
    cache_key = f"partido_votacoes_stats:{partido_id}"
    cached = _cache_live.get(cache_key)
    if cached is not None:
        return cached

    partido = await get_partido_by_id(partido_id)
    if not partido:
        return {}
    sigla = partido["sigla"]

    from datetime import date, timedelta
    data_inicio = (date.today() - timedelta(days=180)).strftime("%Y-%m-%d")

    # siglaOrgao não é suportado como filtro; busca ampla e filtra PLEN localmente
    payload = await _fetch_camara_json(
        "/votacoes",
        params={"dataInicio": data_inicio, "itens": 100},
    )
    votacoes_list = [v for v in payload.get("dados", []) if v.get("siglaOrgao") == "PLEN"][:20]

    all_results: list = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for i in range(0, len(votacoes_list), 5):
            batch = votacoes_list[i : i + 5]
            batch_results = await asyncio.gather(
                *[_fetch_votacao_party_stats(client, v, sigla) for v in batch],
                return_exceptions=True,
            )
            all_results.extend(batch_results)
            if i + 5 < len(votacoes_list):
                await asyncio.sleep(0.3)

    votacoes_detail = [r for r in all_results if isinstance(r, dict)]
    total_sim = sum(v["sim"] for v in votacoes_detail)
    total_nao = sum(v["nao"] for v in votacoes_detail)
    total_abstencao = sum(v["abstencao"] for v in votacoes_detail)

    result: Dict[str, Any] = {
        "total_sim": total_sim,
        "total_nao": total_nao,
        "total_abstencao": total_abstencao,
        "votacoes": sorted(votacoes_detail, key=lambda x: x["data"], reverse=True)[:10],
    }
    # Only cache when we actually found data — empty results may be transient API failures
    if total_sim + total_nao + total_abstencao > 0:
        _cache_live.set(cache_key, result)
    return result


async def _fetch_dep_despesas_totals(
    client: httpx.AsyncClient,
    dep_id: int,
    ano: int = 2025,
) -> Dict[str, float]:
    try:
        resp = await client.get(
            f"{_CAMARA_BASE}/deputados/{dep_id}/despesas",
            params={"ano": ano, "itens": 100},
            timeout=12.0,
        )
        if not resp.is_success:
            return {}
        cats: Dict[str, float] = {}
        for d in resp.json().get("dados", []):
            cat = d.get("tipoDespesa") or "Outros"
            val = float(d.get("valorLiquido") or 0)
            if val > 0:
                cats[cat] = cats.get(cat, 0) + val
        return cats
    except Exception:
        return {}


async def get_partido_gastos(partido_id: int) -> Dict[str, Any]:
    cache_key = f"partido_gastos:{partido_id}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    partido = await get_partido_by_id(partido_id)
    if not partido:
        return {}
    sigla = partido["sigla"]

    all_dep = await get_deputados()
    membros = [d for d in all_dep if d.sigla_partido == sigla]

    from datetime import date
    ano_atual = date.today().year

    # Try current year then previous — track which year has data
    ano_dados = ano_atual
    async with httpx.AsyncClient(timeout=20.0) as client:
        results = await asyncio.gather(
            *[_fetch_dep_despesas_totals(client, d.id, ano_atual) for d in membros[:60]],
            return_exceptions=True,
        )

    categorias: Dict[str, float] = {}
    for res in results:
        if isinstance(res, dict):
            for cat, val in res.items():
                categorias[cat] = categorias.get(cat, 0) + val

    if not categorias:
        ano_dados = ano_atual - 1
        async with httpx.AsyncClient(timeout=20.0) as client:
            results = await asyncio.gather(
                *[_fetch_dep_despesas_totals(client, d.id, ano_dados) for d in membros[:60]],
                return_exceptions=True,
            )
        for res in results:
            if isinstance(res, dict):
                for cat, val in res.items():
                    categorias[cat] = categorias.get(cat, 0) + val

    total = sum(categorias.values())
    sorted_cats = sorted(
        [{"categoria": k, "valor": v} for k, v in categorias.items()],
        key=lambda x: x["valor"],
        reverse=True,
    )[:8]

    result = {"total": total, "categorias": sorted_cats, "ano": ano_dados}
    _cache.set(cache_key, result)
    return result


async def get_partido_lideranca(partido_id: int) -> Dict[str, Any]:
    cache_key = f"partido_lideranca:{partido_id}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    partido = await get_partido_by_id(partido_id)
    if not partido:
        return {}

    sigla = partido["sigla"]
    total_membros = partido.get("totalMembros") or 0
    popularidade_camara = round((total_membros / 513) * 100, 1)

    lider_raw = partido.get("lider") or {}
    lider_nome = lider_raw.get("nome", "")
    lider_wiki = lider_nome.replace(" ", "_") if lider_nome else ""

    presidente_info = _PARTY_PRESIDENTS.get(sigla, {})
    presidente_nome = presidente_info.get("nome", "")
    presidente_wiki = presidente_info.get("wiki", "")

    async def _none() -> None:
        return None

    def _norm(s: str) -> str:
        import unicodedata
        nfkd = unicodedata.normalize("NFKD", s.upper())
        return "".join(c for c in nfkd if not unicodedata.combining(c))

    # Busca paralela: summaries + pageviews + listas de senadores e deputados
    from .senado_service import get_senadores as _get_senadores
    (
        lider_summary, lider_pv, pres_summary, pres_pv,
        senadores_list, deputados_list,
    ) = await asyncio.gather(
        get_summary(lider_wiki) if lider_wiki else _none(),
        get_pageviews(lider_wiki) if lider_wiki else _none(),
        get_summary(presidente_wiki) if presidente_wiki else _none(),
        get_pageviews(presidente_wiki) if presidente_wiki else _none(),
        _get_senadores(),
        get_deputados(),
        return_exceptions=True,
    )

    def safe(v: Any) -> Any:
        return v if not isinstance(v, Exception) else None

    lider_summary = safe(lider_summary)
    lider_pv = safe(lider_pv)
    pres_summary = safe(pres_summary)
    pres_pv = safe(pres_pv)
    senadores_list = senadores_list if isinstance(senadores_list, list) else []
    deputados_list = deputados_list if isinstance(deputados_list, list) else []

    # Try to find the presidente's internal profile (senator first, then deputy)
    codigo_senador: Optional[str] = None
    id_deputado: Optional[int] = None
    if presidente_nome:
        pnorm = _norm(presidente_nome)
        for s in senadores_list:
            if _norm(s.nome) == pnorm or _norm(s.nome_completo) == pnorm:
                codigo_senador = s.codigo
                break
        if not codigo_senador:
            for d in deputados_list:
                if _norm(d.nome) == pnorm:
                    id_deputado = d.id
                    break

    result: Dict[str, Any] = {
        "popularidade_camara": popularidade_camara,
        "lider_camara": {
            "nome": lider_nome,
            "uf": lider_raw.get("uf"),
            "urlFoto": lider_raw.get("urlFoto"),
            "uri": lider_raw.get("uri"),
            "urlFotoWiki": (lider_summary or {}).get("thumbnail"),
            "pageviews": lider_pv,
        } if lider_nome else None,
        "presidente": {
            "nome": presidente_nome,
            "urlFotoWiki": (pres_summary or {}).get("thumbnail"),
            "pageviews": pres_pv,
            "urlWiki": f"https://pt.wikipedia.org/wiki/{presidente_wiki}" if presidente_wiki else None,
            "codigoSenador": codigo_senador,
            "idDeputado": id_deputado,
        } if presidente_nome else None,
    }
    _cache.set(cache_key, result)
    return result


async def get_votacao_votos(votacao_id: str) -> Dict[str, Any]:
    """Retorna votos de uma votação agrupados por partido."""
    cache_key = f"votacao_votos:{votacao_id}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        payload = await _fetch_camara_json(
            f"/votacoes/{votacao_id}/votos",
            params={"itens": 513},
        )
    except Exception:
        return {"total": 0, "partidos": []}

    dados = payload.get("dados", [])
    partidos: Dict[str, Dict[str, int]] = {}

    for voto in dados:
        dep = voto.get("deputado_") or {}
        sigla = dep.get("siglaPartido") or "?"
        tipo_upper = (voto.get("tipoVoto") or "").strip().upper()

        if sigla not in partidos:
            partidos[sigla] = {"sim": 0, "nao": 0, "abstencao": 0, "outros": 0}

        if tipo_upper == "SIM":
            partidos[sigla]["sim"] += 1
        elif tipo_upper in ("NÃO", "NAO"):
            partidos[sigla]["nao"] += 1
        elif tipo_upper in ("ABSTENÇÃO", "ABSTENCAO"):
            partidos[sigla]["abstencao"] += 1
        else:
            partidos[sigla]["outros"] += 1

    sorted_partidos = sorted(
        [{"sigla": s, **counts} for s, counts in partidos.items()],
        key=lambda x: -(x["sim"] + x["nao"] + x["abstencao"] + x["outros"]),
    )

    result: Dict[str, Any] = {"total": len(dados), "partidos": sorted_partidos}
    _cache.set(cache_key, result)
    return result


async def get_votacoes_recentes(itens: int = 30, data_inicio: str | None = None) -> List[Votacao]:
    cache_key = f"votacoes_recentes:{itens}:{data_inicio}"
    cached = _cache_live.get(cache_key)
    if cached is not None:
        return cached

    params: Dict[str, Any] = {"itens": itens}
    if data_inicio:
        params["dataInicio"] = data_inicio

    payload = await _fetch_camara_json("/votacoes", params=params)
    items = payload.get("dados", [])
    votacoes = [_to_votacao(item) for item in items]
    _cache_live.set(cache_key, votacoes)
    return votacoes
