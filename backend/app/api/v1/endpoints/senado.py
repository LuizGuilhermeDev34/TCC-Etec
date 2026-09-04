import xml.etree.ElementTree as ET
from typing import List

from fastapi import APIRouter, HTTPException, Path, Query
from httpx import HTTPError

from ....schemas.deputado_votacao import DeputadoVotacaoOut
from ....schemas.senador import SenadorOut
from ....services.senado_service import get_senador_votacoes, get_senadores

router = APIRouter(prefix="/senado", tags=["senado"])

# httpx.HTTPError cobre rede/timeout/status de erro; ET.ParseError cobre XML
# malformado -- as duas falhas reais que senado_service.get_senador_votacoes
# agora deixa propagar em vez de mascarar como "sem votos" (F-11). Não há
# distinção 404-vs-503 aqui (diferente de _raise_camara_error): testado ao
# vivo, um código de senador inexistente devolve 200 com XML válido e vazio
# -- a API do Senado não sinaliza "não encontrado" de nenhuma forma
# detectável para este recurso (F-26 permanece parcialmente aberto por isso).
_SENADO_ERROS = (HTTPError, ET.ParseError)


@router.get("/senadores", response_model=List[SenadorOut])
async def read_senadores() -> List[SenadorOut]:
    try:
        senadores = await get_senadores()
    except _SENADO_ERROS as error:
        raise HTTPException(status_code=503, detail="Serviço do Senado indisponível") from error
    return [SenadorOut.model_validate(s) for s in senadores]


@router.get("/senadores/{codigo}/votacoes", response_model=List[DeputadoVotacaoOut])
async def read_senador_votacoes(
    codigo: str = Path(..., pattern=r"^[A-Za-z0-9-]+$"),
    data_inicio: str | None = Query(None),
) -> List[DeputadoVotacaoOut]:
    try:
        votacoes = await get_senador_votacoes(codigo, data_inicio=data_inicio)
    except _SENADO_ERROS as error:
        raise HTTPException(status_code=503, detail="Serviço do Senado indisponível") from error
    return [DeputadoVotacaoOut.model_validate(v, from_attributes=True) for v in votacoes]
