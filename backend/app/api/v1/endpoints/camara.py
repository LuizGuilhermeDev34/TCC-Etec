from typing import Any, List

from fastapi import APIRouter, HTTPException, Path, Query
from httpx import HTTPStatusError

from ....schemas.deputado import DeputadoOut
from ....schemas.deputado_despesa import DeputadoDespesaOut
from ....schemas.deputado_detail import DeputadoDetailOut
from ....schemas.deputado_votacao import DeputadoVotacaoOut
from ....schemas.proposicao import ProposicaoOut
from ....schemas.votacao import VotacaoOut
from ....services.camara_service import (
    get_deputado_despesas,
    get_deputado_detail,
    get_deputado_proposicoes,
    get_deputado_votacoes,
    get_deputados,
    get_partido_by_id,
    get_partido_gastos,
    get_partido_lideranca,
    get_partido_votacoes_stats,
    get_partidos,
    get_proposicoes,
    get_votacao_votos,
    get_votacoes_recentes,
)

router = APIRouter(prefix="/camara", tags=["camara"])


@router.get("/deputados", response_model=List[DeputadoOut])
async def read_deputados(legislatura: int = Query(57, ge=50)) -> List[DeputadoOut]:
    try:
        deputados = await get_deputados(legislatura=legislatura)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    return [DeputadoOut.model_validate(d) for d in deputados]


@router.get("/deputados/{deputado_id}", response_model=DeputadoDetailOut)
async def read_deputado(deputado_id: int = Path(..., ge=1)) -> DeputadoDetailOut:
    try:
        detail = await get_deputado_detail(deputado_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    return DeputadoDetailOut.model_validate(detail, from_attributes=True)


@router.get("/deputados/{deputado_id}/proposicoes", response_model=List[ProposicaoOut])
async def read_deputado_proposicoes(deputado_id: int = Path(..., ge=1)) -> List[ProposicaoOut]:
    try:
        proposicoes = await get_deputado_proposicoes(deputado_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    return [ProposicaoOut.model_validate(p) for p in proposicoes]


@router.get("/deputados/{deputado_id}/votacoes", response_model=List[DeputadoVotacaoOut])
async def read_deputado_votacoes(
    deputado_id: int = Path(..., ge=1),
) -> List[DeputadoVotacaoOut]:
    try:
        votacoes = await get_deputado_votacoes(deputado_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    return [DeputadoVotacaoOut.model_validate(v, from_attributes=True) for v in votacoes]


@router.get("/deputados/{deputado_id}/despesas", response_model=List[DeputadoDespesaOut])
async def read_deputado_despesas(
    deputado_id: int = Path(..., ge=1),
    ano: int = Query(2025, ge=2019),
) -> List[DeputadoDespesaOut]:
    try:
        despesas = await get_deputado_despesas(deputado_id, ano=ano)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    return [DeputadoDespesaOut.model_validate(d, from_attributes=True) for d in despesas]


@router.get("/partidos")
async def read_partidos() -> List[Any]:
    try:
        return await get_partidos()
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error


@router.get("/partidos/{partido_id}")
async def read_partido(partido_id: int = Path(..., ge=1)) -> Any:
    try:
        partido = await get_partido_by_id(partido_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    if not partido:
        raise HTTPException(status_code=404, detail="Partido não encontrado")
    return partido


@router.get("/partidos/{partido_id}/lideranca")
async def read_partido_lideranca(partido_id: int = Path(..., ge=1)) -> Any:
    try:
        return await get_partido_lideranca(partido_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error


@router.get("/partidos/{partido_id}/votacoes-stats")
async def read_partido_votacoes_stats(partido_id: int = Path(..., ge=1)) -> Any:
    try:
        return await get_partido_votacoes_stats(partido_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error


@router.get("/partidos/{partido_id}/gastos")
async def read_partido_gastos(partido_id: int = Path(..., ge=1)) -> Any:
    try:
        return await get_partido_gastos(partido_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error


@router.get("/proposicoes", response_model=List[ProposicaoOut])
async def read_proposicoes(
    ano: int = Query(2026, ge=1900),
    tipo: str = Query(""),
    itens: int = Query(20, ge=1, le=100),
) -> List[ProposicaoOut]:
    try:
        proposicoes = await get_proposicoes(ano=ano, tipo=tipo, itens=itens)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    return [ProposicaoOut.model_validate(p) for p in proposicoes]


@router.get("/votacoes/{votacao_id}/votos")
async def read_votacao_votos(votacao_id: str = Path(..., pattern=r"^[A-Za-z0-9-]+$")) -> Any:
    try:
        return await get_votacao_votos(votacao_id)
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error


@router.get("/votacoes", response_model=List[VotacaoOut])
async def read_votacoes(
    itens: int = Query(30, ge=1, le=100),
    data_inicio: str | None = Query(None),
    data_fim: str | None = Query(None),
    enriquecer: bool = Query(False),
) -> List[VotacaoOut]:
    try:
        votacoes = await get_votacoes_recentes(
            itens=itens, data_inicio=data_inicio, data_fim=data_fim, enrich=enriquecer
        )
    except HTTPStatusError as error:
        raise HTTPException(status_code=503, detail="Serviço da Câmara indisponível") from error
    return [VotacaoOut.model_validate(v) for v in votacoes]
