from typing import Optional
from pydantic import BaseModel


class ProposicaoOut(BaseModel):
    id: int
    sigla_tipo: str
    numero: int
    ano: int
    ementa: str
    data_apresentacao: Optional[str] = None
    url_inteiro_teor: Optional[str] = None
    descricao_situacao: Optional[str] = None
    orgao_situacao: Optional[str] = None

    model_config = {"from_attributes": True}
