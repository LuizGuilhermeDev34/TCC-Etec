from dataclasses import dataclass
from typing import Optional


@dataclass
class Votacao:
    id: str
    data: str
    data_hora_registro: str
    sigla_orgao: str
    proposicao_objeto: Optional[str]
    descricao: str
    aprovacao: int
