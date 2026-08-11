from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Activity:
    type: str
    title: str
    description: str
    actor: str
    date: str
    aprovacao: Optional[int] = field(default=None)
    sigla_orgao: Optional[str] = field(default=None)
    votacao_id: Optional[str] = field(default=None)
