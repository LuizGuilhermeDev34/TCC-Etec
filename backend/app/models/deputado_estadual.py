from dataclasses import dataclass
from typing import Optional


@dataclass
class DeputadoEstadual:
    id: int
    nome: str
    partido: str
    uf: str
    mandato: str = "2023-2027"
    url_foto: Optional[str] = None
    email: Optional[str] = None
    url_pagina: Optional[str] = None
    biografia: Optional[str] = None
