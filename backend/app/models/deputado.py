from dataclasses import dataclass
from typing import Optional


@dataclass
class Deputado:
    id: int
    nome: str
    sigla_partido: str
    sigla_uf: str
    id_legislatura: int
    url_foto: Optional[str] = None
    email: Optional[str] = None
