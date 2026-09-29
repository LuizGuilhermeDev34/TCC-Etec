from typing import Optional
from pydantic import BaseModel


class DeputadoEstadualOut(BaseModel):
    id: int
    nome: str
    partido: str
    uf: str
    mandato: str
    url_foto: Optional[str] = None
    email: Optional[str] = None
    url_pagina: Optional[str] = None
    biografia: Optional[str] = None

    model_config = {"from_attributes": True}


class DeputadoEstadualDespesaOut(BaseModel):
    ano: int
    mes: int
    categoria_id: int
    valor: float
    matricula: int
    deputado: str
    tipo: str
    fornecedor: str
    cnpj: Optional[str] = None

    model_config = {"from_attributes": True}