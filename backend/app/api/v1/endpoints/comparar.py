import asyncio
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Path

from ....services.camara_service import (
    get_deputado_detail,
    get_deputado_despesas,
    get_deputado_proposicoes,
    get_deputado_proposicoes_por_tipo,
)
from ....services.tse_service import get_patrimonio_deputado_federal

router = APIRouter(prefix="/comparar", tags=["comparar"])


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

    # Contagem real por tipo (não a amostra de 100) — evita mostrar "3822
    # total" ao lado de um detalhamento que soma 97, como se os números se
    # contradissessem. Só busca os tipos que já apareceram na amostra: um
    # tipo raro demais pra aparecer nos 100 itens mais recentes (ordenados
    # por ano) fica de fora do detalhamento, mesma ressalva de sempre.
    tipos_na_amostra = list(_por_tipo(proposicoes).keys())
    proposicoes_por_tipo = await get_deputado_proposicoes_por_tipo(detail.id, tipos_na_amostra)

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
        "proposicoes_por_tipo": proposicoes_por_tipo,
        "gastos_total": gastos_total,
        # despesas vazio hoje é um problema de fonte (Câmara respondendo 200
        # com dados: [] para todo mundo, verificado ao vivo), não zero real.
        "despesas_indisponivel": len(despesas) == 0,
        "patrimonio_total": patrimonio_total,
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
