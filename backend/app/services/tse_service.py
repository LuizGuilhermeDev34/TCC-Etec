"""
Serviço TSE — patrimônio declarado na eleição 2022.
Cargos: 6=Dep.Federal, 7=Dep.Estadual, 5=Senador

Índice lido de um JSON local (backend/app/data/tse_patrimonio_2022.json),
não baixado da rede em runtime. Achado da auditoria de código (F-04):
o CDN do TSE bloqueia acesso por IP/ASN de datacenter na borda da Akamai —
confirmado ao vivo que até a home do tse.jus.br (não só os ZIPs de dados)
retorna 403 "Access Denied" da Akamai a partir de nuvem, mas carrega normal
de uma rede residencial. Como o Render também é datacenter, o backend nunca
conseguiria baixar esses ZIPs em produção. O índice foi baixado uma vez de
uma rede sem esse bloqueio e processado por scripts/build_tse_index.py —
ver esse script para reproduzir/atualizar. Fica desatualizado até a próxima
geração manual, mas funciona sem depender de rede em cada cold start.
"""
import json
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional

_INDEX_PATH = Path(__file__).resolve().parent.parent / "data" / "tse_patrimonio_2022.json"

# nome_upper → list[{"sq", "uf", "cargo"}]
_cand_index: Optional[Dict[str, List[Dict[str, str]]]] = None
# sq_candidato → list[{"tipo", "descricao", "valor"}]
_bens_index: Optional[Dict[str, List[Dict[str, Any]]]] = None


def _ensure_indices() -> None:
    global _cand_index, _bens_index
    if _cand_index is not None:
        return
    if not _INDEX_PATH.exists():
        # Sem o arquivo local, não há como calcular patrimônio (a fonte de
        # rede está bloqueada — ver docstring do módulo). Índices vazios em
        # vez de exceção: _get_patrimonio já trata "sem dado" como {}.
        _cand_index = {}
        _bens_index = {}
        return
    with open(_INDEX_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    _cand_index = data.get("candidatos", {})
    _bens_index = data.get("bens", {})


def _normalizar(nome: str) -> str:
    """Remove acentos e deixa em maiúsculo para comparação fuzzy."""
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
    _ensure_indices()
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
