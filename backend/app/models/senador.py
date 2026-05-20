from dataclasses import dataclass
from typing import Optional


@dataclass
class Senador:
    codigo: str
    nome: str
    nome_completo: str
    sexo: str
    partido: str
    uf: str
    url_foto: Optional[str] = None
    url_pagina: Optional[str] = None
    email: Optional[str] = None
