from typing import Any, Dict

from fastapi import APIRouter, Query

from ....services.tse_service import (
    get_patrimonio_deputado_estadual,
    get_patrimonio_deputado_federal,
    get_patrimonio_senador,
)

router = APIRouter(prefix="/patrimonio", tags=["patrimonio"])


@router.get("/deputado-federal")
async def patrimonio_deputado_federal(
    nome: str = Query(...),
    nome_civil: str = Query(""),
) -> Dict[str, Any]:
    return await get_patrimonio_deputado_federal(nome, nome_civil)


@router.get("/senador")
async def patrimonio_senador(nome: str = Query(...)) -> Dict[str, Any]:
    return await get_patrimonio_senador(nome)


@router.get("/deputado-estadual")
async def patrimonio_deputado_estadual(
    nome: str = Query(...),
    uf: str = Query("SP"),
) -> Dict[str, Any]:
    return await get_patrimonio_deputado_estadual(nome, uf)
