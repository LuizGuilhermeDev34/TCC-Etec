from typing import Optional
from pydantic import BaseModel


class DeputadoOut(BaseModel):
    id: int
    nome: str
    sigla_partido: str
    sigla_uf: str
    id_legislatura: int
    url_foto: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}
