from typing import Optional
from pydantic import BaseModel


class VotacaoOut(BaseModel):
    id: str
    data: str
    data_hora_registro: str
    sigla_orgao: str
    proposicao_objeto: Optional[str] = None
    descricao: str
    aprovacao: int
    merito: bool = False
    proposicao_ementa: Optional[str] = None

    model_config = {"from_attributes": True}
