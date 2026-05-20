from typing import Optional
from pydantic import BaseModel


class SenadorOut(BaseModel):
    codigo: str
    nome: str
    nome_completo: str
    sexo: str
    partido: str
    uf: str
    url_foto: Optional[str] = None
    url_pagina: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}
