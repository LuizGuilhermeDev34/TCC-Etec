from typing import List

from fastapi import APIRouter, HTTPException

from ....schemas.activity import ActivityOut
from ....services.activity_service import get_recent_activities

router = APIRouter(prefix="/atividades", tags=["atividades"])


@router.get("/recentes", response_model=List[ActivityOut])
async def read_recent_activities() -> List[ActivityOut]:
    try:
        activities = await get_recent_activities()
        return [ActivityOut.model_validate(a) for a in activities]
    except Exception as error:
        raise HTTPException(status_code=503, detail="Serviço indisponível") from error
