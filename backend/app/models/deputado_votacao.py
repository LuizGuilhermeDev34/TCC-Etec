from dataclasses import dataclass
from typing import Optional


@dataclass
class DeputadoVotacao:
    id: str
    data: str
    sigla_orgao: str
    tipo_voto: str  # Sim | Não | Abstenção | Obstrução | Art. 17
    proposicao_id: Optional[int] = None
    proposicao_ementa: Optional[str] = None
    proposicao_sigla: Optional[str] = None
    proposicao_numero: Optional[int] = None
    proposicao_ano: Optional[int] = None
