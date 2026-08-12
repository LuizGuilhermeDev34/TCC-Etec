import asyncio
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Path

from ....services.camara_service import (
    get_deputado_detail,
    get_deputado_despesas,
    get_deputado_proposicoes,
)
from ....services.tse_service import get_patrimonio_deputado_federal

router = APIRouter(prefix="/comparar", tags=["comparar"])


def _score_atividade(proposicoes: list, gastos_total: float) -> float:
    """Índice de Atividade Legislativa — 0 a 10."""
    total = len(proposicoes)
    tipos = set(p.sigla_tipo for p in proposicoes)
    impacto = sum(
        1 for p in proposicoes
        if p.sigla_tipo in ("PL", "PEC", "PLP", "PDL", "MPV")
    )

    pts_total = min(total / 80.0, 1.0) * 4.0
    pts_impacto = min(impacto / 20.0, 1.0) * 3.0
    pts_variedade = min(len(tipos) / 5.0, 1.0) * 2.0
    pts_gastos = max(0.0, 1.0 - min(gastos_total / 100_000.0, 1.0)) * 1.0

    return round(pts_total + pts_impacto + pts_variedade + pts_gastos, 1)


def _por_tipo(proposicoes: list) -> Dict[str, int]:
    tipos: Dict[str, int] = {}
    for p in proposicoes:
        tipos[p.sigla_tipo] = tipos.get(p.sigla_tipo, 0) + 1
    return dict(sorted(tipos.items(), key=lambda x: x[1], reverse=True))


async def _get_deputado_data(dep_id: int) -> Dict[str, Any]:
    # Detail primeiro — nome é necessário para buscar patrimônio no TSE
    try:
        detail = await get_deputado_detail(dep_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Deputado {dep_id} não encontrado") from exc

    # Proposições, despesas e patrimônio em paralelo
    proposicoes_result, despesas, patrimonio = await asyncio.gather(
        get_deputado_proposicoes(dep_id),
        get_deputado_despesas(dep_id),
        get_patrimonio_deputado_federal(detail.nome, detail.nome_civil or ""),
        return_exceptions=True,
    )

    if isinstance(proposicoes_result, tuple):
        proposicoes, proposicoes_total_real = proposicoes_result
    else:
        proposicoes, proposicoes_total_real = [], 0
    despesas = despesas if isinstance(despesas, list) else []
    patrimonio = patrimonio if isinstance(patrimonio, dict) else {}

    gastos_total = sum(d.valor_liquido for d in despesas if d.valor_liquido > 0)
    patrimonio_total = patrimonio.get("total", 0.0)

    return {
        "id": detail.id,
        "nome": detail.nome,
        "nome_civil": detail.nome_civil,
        "sigla_partido": detail.sigla_partido,
        "sigla_uf": detail.sigla_uf,
        "url_foto": detail.url_foto,
        "id_legislatura": detail.id_legislatura,
        "escolaridade": detail.escolaridade,
        "data_nascimento": detail.data_nascimento,
        "proposicoes_total": proposicoes_total_real,
        "proposicoes_por_tipo": _por_tipo(proposicoes),
        "gastos_total": gastos_total,
        "patrimonio_total": patrimonio_total,
        "score_atividade": _score_atividade(proposicoes, gastos_total),
    }


@router.get("/deputados/{id_a}/{id_b}")
async def comparar_deputados(
    id_a: int = Path(..., ge=1),
    id_b: int = Path(..., ge=1),
) -> Dict[str, Any]:
    if id_a == id_b:
        raise HTTPException(status_code=400, detail="Os dois IDs devem ser diferentes")

    a, b = await asyncio.gather(
        _get_deputado_data(id_a),
        _get_deputado_data(id_b),
        return_exceptions=True,
    )

    if isinstance(a, Exception):
        raise a
    if isinstance(b, Exception):
        raise b

    return {"a": a, "b": b}
