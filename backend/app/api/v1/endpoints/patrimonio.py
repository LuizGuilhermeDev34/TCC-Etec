from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from ....services.tse_service import (
    get_patrimonio_deputado_estadual,
    get_patrimonio_deputado_federal,
    get_patrimonio_senador,
)

router = APIRouter(prefix="/patrimonio", tags=["patrimonio"])

# tse_service.py lê um índice local hoje (não faz mais chamada de rede — ver
# docstring do módulo), então "indisponível" aqui só cobriria um bug real de
# leitura/parse do índice, não uma falha externa. Ainda assim, nenhuma das 3
# rotas tinha tratamento de erro nenhum (achado da auditoria de código,
# F-04/F-16) — sem isso, um bug nessa camada vazaria como 500 cru.
def _raise_patrimonio_error(error: Exception) -> None:
    raise HTTPException(status_code=503, detail="Serviço de patrimônio indisponível") from error


@router.get("/deputado-federal")
async def patrimonio_deputado_federal(
    nome: str = Query(...),
    nome_civil: str = Query(""),
) -> Dict[str, Any]:
    try:
        return await get_patrimonio_deputado_federal(nome, nome_civil)
    except Exception as error:
        _raise_patrimonio_error(error)


@router.get("/senador")
async def patrimonio_senador(nome: str = Query(...)) -> Dict[str, Any]:
    try:
        return await get_patrimonio_senador(nome)
    except Exception as error:
        _raise_patrimonio_error(error)


@router.get("/deputado-estadual")
async def patrimonio_deputado_estadual(
    nome: str = Query(...),
    uf: str = Query("SP", min_length=2, max_length=2),
) -> Dict[str, Any]:
    try:
        return await get_patrimonio_deputado_estadual(nome, uf)
    except Exception as error:
        _raise_patrimonio_error(error)
