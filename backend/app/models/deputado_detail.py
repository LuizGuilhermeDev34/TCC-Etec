from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class GabineteInfo:
    andar: Optional[str] = None
    predio: Optional[str] = None
    sala: Optional[str] = None
    telefone: Optional[str] = None


@dataclass
class DeputadoDetail:
    id: int
    nome: str
    nome_civil: str
    sigla_partido: str
    sigla_uf: str
    id_legislatura: int
    url_foto: Optional[str] = None
    email: Optional[str] = None
    cpf: Optional[str] = None
    sexo: Optional[str] = None
    data_nascimento: Optional[str] = None
    uf_nascimento: Optional[str] = None
    municipio_nascimento: Optional[str] = None
    escolaridade: Optional[str] = None
    url_website: Optional[str] = None
    redes_sociais: List[str] = field(default_factory=list)
    descricao_status: Optional[str] = None
    gabinete: Optional[GabineteInfo] = None
    biografia: Optional[str] = None
