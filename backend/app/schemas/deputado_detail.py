from typing import List, Optional
from pydantic import BaseModel


class GabineteOut(BaseModel):
    andar: Optional[str] = None
    predio: Optional[str] = None
    sala: Optional[str] = None
    telefone: Optional[str] = None

    model_config = {"from_attributes": True}


class DeputadoDetailOut(BaseModel):
    id: int
    nome: str
    nome_civil: str
    sigla_partido: str
    sigla_uf: str
    id_legislatura: int
    url_foto: Optional[str] = None
    email: Optional[str] = None
    sexo: Optional[str] = None
    data_nascimento: Optional[str] = None
    uf_nascimento: Optional[str] = None
    municipio_nascimento: Optional[str] = None
    escolaridade: Optional[str] = None
    url_website: Optional[str] = None
    redes_sociais: List[str] = []
    descricao_status: Optional[str] = None
    gabinete: Optional[GabineteOut] = None
    biografia: Optional[str] = None

    model_config = {"from_attributes": True}
