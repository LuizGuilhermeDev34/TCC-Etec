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
    # Heurística: True quando a descrição bruta da Câmara trazia um placar
    # embutido ("Sim: X; Não: Y; Total: Z") E a descrição não contém um verbo
    # de trâmite processual (requerimento, parecer, deferido...) — só placar
    # não basta, requerimentos às vezes são votados nominalmente mas continuam
    # sendo trâmite, não decisão de mérito. Calculado antes da limpeza da
    # descrição, não a partir de proposicao_objeto (que hoje quase sempre
    # existe, já que o enriquecimento busca proposicoesAfetadas mesmo para
    # despachos).
    merito: bool = False
    proposicao_ementa: Optional[str] = None
