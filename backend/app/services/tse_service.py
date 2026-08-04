"""
Serviço TSE — patrimônio declarado na eleição 2022.
Baixa os ZIPs do CDN do TSE uma vez e mantém índice em memória.
Cargos: 6=Dep.Federal, 7=Dep.Estadual, 5=Senador
"""
import csv
import io
import zipfile
from typing import Any, Dict, Iterator, List, Optional, Set

import httpx

# ── URLs dos ZIPs ──────────────────────────────────────────────────────────────
_CAND_ZIP = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2022.zip"
_BENS_ZIP = "https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2022.zip"

_CARGOS_RELEVANTES = {"5", "6", "7"}

# ── Índices em memória ─────────────────────────────────────────────────────────
# nome_upper → list[{"sq", "uf", "cargo"}]
_cand_index: Optional[Dict[str, List[Dict[str, str]]]] = None
# sq_candidato → list[{"tipo", "descricao", "valor"}]
_bens_index: Optional[Dict[str, List[Dict[str, Any]]]] = None
_loading = False


async def _download_zip(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=90.0) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.content


def _iter_csv_from_zip(data: bytes, encoding: str = "latin-1") -> Iterator[Dict[str, str]]:
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        brasil = [n for n in zf.namelist() if "BRASIL" in n.upper() and n.endswith(".csv")]
        name = brasil[0] if brasil else zf.namelist()[0]
        with zf.open(name) as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding=encoding), delimiter=";")
            for row in reader:
                yield row


# asyncio.gather sem importar asyncio no topo (evita circular import)
async def _ensure_indices() -> None:
    global _loading, _cand_index, _bens_index
    if _cand_index is not None:
        return
    if _loading:
        # Aguarda carregamento em progresso
        import asyncio
        while _loading:
            await asyncio.sleep(0.5)
        return
    _loading = True
    try:
        import asyncio
        cand_bytes, bens_bytes = await asyncio.gather(
            _download_zip(_CAND_ZIP),
            _download_zip(_BENS_ZIP),
        )

        ci: Dict[str, List[Dict[str, str]]] = {}
        sqs_relevantes: Set[str] = set()
        for row in _iter_csv_from_zip(cand_bytes):
            cargo = row.get("CD_CARGO", "")
            if cargo not in _CARGOS_RELEVANTES:
                continue
            nome = row.get("NM_CANDIDATO", "").upper().strip()
            sq = row.get("SQ_CANDIDATO", "")
            if not nome or not sq:
                continue
            ci.setdefault(nome, []).append({"sq": sq, "uf": row.get("SG_UF", ""), "cargo": cargo})
            sqs_relevantes.add(sq)
        _cand_index = ci

        bi: Dict[str, List[Dict[str, Any]]] = {}
        for row in _iter_csv_from_zip(bens_bytes):
            sq = row.get("SQ_CANDIDATO", "").strip()
            if not sq or sq not in sqs_relevantes:
                continue
            valor_str = row.get("VR_BEM_CANDIDATO", "0").replace(".", "").replace(",", ".")
            try:
                valor = float(valor_str)
            except ValueError:
                valor = 0.0
            bi.setdefault(sq, []).append({
                "tipo": row.get("DS_TIPO_BEM_CANDIDATO", "Outros"),
                "descricao": row.get("DS_BEM_CANDIDATO", ""),
                "valor": valor,
            })
        _bens_index = bi
    finally:
        _loading = False


def _normalizar(nome: str) -> str:
    """Remove acentos e deixa em maiúsculo para comparação fuzzy."""
    import unicodedata
    nfkd = unicodedata.normalize("NFKD", nome.upper())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _buscar_sq(nome: str, uf: Optional[str], cargo_cod: Optional[str]) -> Optional[str]:
    """Retorna o SQ_CANDIDATO mais provável para um nome/UF/cargo."""
    assert _cand_index is not None
    nome_norm = _normalizar(nome)

    # Busca exata primeiro
    candidatos = _cand_index.get(nome.upper().strip(), [])

    # Busca normalizada se não encontrou
    if not candidatos:
        for key, val in _cand_index.items():
            if _normalizar(key) == nome_norm:
                candidatos = val
                break

    # Busca parcial — nome do meio pode ser abreviado no TSE
    if not candidatos:
        partes = nome_norm.split()
        if len(partes) >= 2:
            primeiro, ultimo = partes[0], partes[-1]
            for key, val in _cand_index.items():
                kn = _normalizar(key)
                if kn.startswith(primeiro) and kn.endswith(ultimo):
                    candidatos = val
                    break

    if not candidatos:
        return None

    # Filtrar por UF e cargo se fornecidos
    filtrados = candidatos
    if uf:
        filtrados = [c for c in candidatos if c["uf"].upper() == uf.upper()] or candidatos
    if cargo_cod:
        filtrados = [c for c in filtrados if c["cargo"] == cargo_cod] or filtrados

    return filtrados[0]["sq"] if filtrados else None


def _sumarizar(bens: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = sum(b["valor"] for b in bens)
    categorias: Dict[str, float] = {}
    for b in bens:
        categorias[b["tipo"]] = categorias.get(b["tipo"], 0.0) + b["valor"]
    return {
        "total": total,
        "categorias": dict(sorted(categorias.items(), key=lambda x: x[1], reverse=True)),
        "itens": sorted(bens, key=lambda x: x["valor"], reverse=True)[:10],
        "fonte": "TSE — Declaração de bens 2022 (mais recente disponível)",
    }


async def _get_patrimonio(nome: str, uf: Optional[str], cargo_cod: str) -> Dict[str, Any]:
    await _ensure_indices()
    sq = _buscar_sq(nome, uf, cargo_cod)
    if not sq or _bens_index is None:
        return {}
    bens = _bens_index.get(sq, [])
    if not bens:
        return {}
    return _sumarizar(bens)


async def get_patrimonio_deputado_federal(nome: str, nome_civil: str = "") -> Dict[str, Any]:
    # Cargo 6 = Deputado Federal, UE = BR
    result = await _get_patrimonio(nome_civil or nome, "BR", "6")
    if not result:
        result = await _get_patrimonio(nome, "BR", "6")
    return result


async def get_patrimonio_senador(nome: str) -> Dict[str, Any]:
    return await _get_patrimonio(nome, "BR", "5")


async def get_patrimonio_deputado_estadual(nome: str, uf: str = "SP") -> Dict[str, Any]:
    return await _get_patrimonio(nome, uf, "7")
