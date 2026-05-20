from typing import Optional
from pydantic import BaseModel


class DeputadoDespesaOut(BaseModel):
    ano: int
    mes: int
    tipo_despesa: str
    valor_liquido: float
    nome_fornecedor: str
    data_documento: Optional[str] = None
    url_documento: Optional[str] = None

    model_config = {"from_attributes": True}
