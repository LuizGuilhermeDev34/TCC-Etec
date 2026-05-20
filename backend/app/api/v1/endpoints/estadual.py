from typing import List

from fastapi import APIRouter, HTTPException, Path, Query

from ....schemas.deputado_estadual import DeputadoEstadualOut
from ....services.estadual_service import get_deputado_estadual_by_id, get_deputados_estaduais

router = APIRouter(prefix="/estaduais", tags=["estaduais"])


@router.get("/deputados", response_model=List[DeputadoEstadualOut])
async def read_deputados_estaduais(
    uf: str = Query("SP", min_length=2, max_length=2),
) -> List[DeputadoEstadualOut]:
    deputados = await get_deputados_estaduais(uf=uf)
    return [DeputadoEstadualOut.model_validate(d, from_attributes=True) for d in deputados]


@router.get("/deputados/{deputado_id}", response_model=DeputadoEstadualOut)
async def read_deputado_estadual(deputado_id: int = Path(..., ge=1)) -> DeputadoEstadualOut:
    dep = await get_deputado_estadual_by_id(deputado_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="Deputado não encontrado")
    return DeputadoEstadualOut.model_validate(dep, from_attributes=True)
