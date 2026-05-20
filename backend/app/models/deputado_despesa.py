from dataclasses import dataclass
from typing import Optional


@dataclass
class DeputadoDespesa:
    ano: int
    mes: int
    tipo_despesa: str
    valor_liquido: float
    nome_fornecedor: str
    data_documento: Optional[str] = None
    url_documento: Optional[str] = None
