from dataclasses import dataclass
from typing import Optional


@dataclass
class Proposicao:
    id: int
    sigla_tipo: str
    numero: int
    ano: int
    ementa: str
    data_apresentacao: Optional[str] = None
    url_inteiro_teor: Optional[str] = None
    descricao_situacao: Optional[str] = None
    orgao_situacao: Optional[str] = None
