from .activity_service import get_recent_activities
from .camara_service import get_deputado_detail, get_deputados, get_partidos, get_proposicoes, get_votacoes_recentes
from .estadual_service import get_deputado_estadual_by_id, get_deputados_estaduais
from .senado_service import get_senadores
from .tse_service import get_patrimonio_deputado_estadual, get_patrimonio_deputado_federal, get_patrimonio_senador
from .wikipedia_service import get_bio

__all__ = [
    "get_recent_activities",
    "get_deputado_detail", "get_deputados", "get_partidos", "get_proposicoes", "get_votacoes_recentes",
    "get_deputado_estadual_by_id", "get_deputados_estaduais",
    "get_senadores",
    "get_patrimonio_deputado_estadual", "get_patrimonio_deputado_federal", "get_patrimonio_senador",
    "get_bio",
]
