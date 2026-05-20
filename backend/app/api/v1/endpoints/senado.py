from typing import List

from fastapi import APIRouter, HTTPException, Path, Query

from ....schemas.deputado_votacao import DeputadoVotacaoOut
from ....schemas.senador import SenadorOut
from ....services.senado_service import get_senador_votacoes, get_senadores

router = APIRouter(prefix="/senado", tags=["senado"])


@router.get("/senadores", response_model=List[SenadorOut])
async def read_senadores() -> List[SenadorOut]:
    try:
        senadores = await get_senadores()
    except Exception as error:
        raise HTTPException(status_code=503, detail="Serviço do Senado indisponível") from error
    return [SenadorOut.model_validate(s) for s in senadores]


@router.get("/senadores/{codigo}/votacoes", response_model=List[DeputadoVotacaoOut])
async def read_senador_votacoes(
    codigo: str = Path(...),
    data_inicio: str | None = Query(None),
) -> List[DeputadoVotacaoOut]:
    try:
        votacoes = await get_senador_votacoes(codigo, data_inicio=data_inicio)
    except Exception as error:
        raise HTTPException(status_code=503, detail="Serviço do Senado indisponível") from error
    return [DeputadoVotacaoOut.model_validate(v, from_attributes=True) for v in votacoes]
