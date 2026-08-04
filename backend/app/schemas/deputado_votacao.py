from typing import Optional
from pydantic import BaseModel


class DeputadoVotacaoOut(BaseModel):
    id: str
    data: str
    sigla_orgao: str
    tipo_voto: str
    proposicao_ementa: Optional[str] = None
    proposicao_sigla: Optional[str] = None
    proposicao_numero: Optional[int] = None
    proposicao_ano: Optional[int] = None

    model_config = {"from_attributes": True}
