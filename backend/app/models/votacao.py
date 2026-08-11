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
    # embutido ("Sim: X; Não: Y; Total: Z") antes de ser limpa para exibição —
    # praticamente só votações nominais de mérito têm isso; despachos
    # processuais (parecer, requerimento) não. Calculado antes da limpeza,
    # não a partir de proposicao_objeto (que hoje quase sempre existe, já que
    # o enriquecimento busca proposicoesAfetadas mesmo para despachos).
    merito: bool = False
    proposicao_ementa: Optional[str] = None
