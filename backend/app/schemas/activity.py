from pydantic import BaseModel
from typing import Optional


class ActivityOut(BaseModel):
    type: str
    title: str
    description: str
    actor: str
    date: str
    aprovacao: Optional[int] = None
    sigla_orgao: Optional[str] = None
    votacao_id: Optional[str] = None
    merito: bool = False

    model_config = {"from_attributes": True}
