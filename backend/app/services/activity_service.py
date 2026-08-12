import asyncio
from datetime import datetime, timedelta
from typing import List

from ..core import SimpleCache
from ..models.activity import Activity
from .camara_service import get_votacoes_recentes, get_proposicoes

_cache = SimpleCache(ttl_seconds=120)


async def get_recent_activities() -> List[Activity]:
    cache_key = "activities_recentes"
    cached = _cache.get(cache_key)
    if cached is not None:
        return cached

    ano_atual = datetime.now().year
    data_inicio = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    # dataFim da Câmara é quase-exclusivo do próprio dia final (ver
    # buildDataFim no front) — usar amanhã garante que hoje entra por inteiro.
    data_fim = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    votacoes_result, proposicoes_result = await asyncio.gather(
        get_votacoes_recentes(itens=100, data_inicio=data_inicio, data_fim=data_fim),
        get_proposicoes(ano=ano_atual, tipo="", itens=12),
        return_exceptions=True,
    )

    votacoes = votacoes_result if isinstance(votacoes_result, list) else []
    proposicoes = proposicoes_result if isinstance(proposicoes_result, list) else []

    activities: List[Activity] = []

    votacoes_sorted = sorted(
        votacoes,
        key=lambda v: v.data_hora_registro or v.data or "",
        reverse=True,
    )
    # Sem corte artificial em 20 — itens=100 já limita a chamada, e um corte
    # menor aqui inflava a contagem de "aprovadas" da home (sempre os 20 mais
    # recentes, não uma amostra representativa dos últimos 30 dias).
    for v in votacoes_sorted:
        desc = v.descricao or ""
        activities.append(Activity(
            type="votacao",
            title=v.proposicao_objeto or "Votação plenária",
            description=(desc[:200] + "...") if len(desc) > 200 else desc,
            actor=v.sigla_orgao or "Câmara",
            date=v.data or v.data_hora_registro or "",
            aprovacao=v.aprovacao,
            sigla_orgao=v.sigla_orgao,
            votacao_id=v.id,
            merito=v.merito,
        ))

    for p in proposicoes:
        ementa = p.ementa or ""
        activities.append(Activity(
            type="proposicao",
            title=f"{p.sigla_tipo} {p.numero}/{p.ano}",
            description=(ementa[:200] + "...") if len(ementa) > 200 else ementa,
            actor="Câmara dos Deputados",
            date=p.data_apresentacao or "",
            aprovacao=None,
            sigla_orgao=None,
        ))

    activities.sort(key=lambda a: a.date or "", reverse=True)

    _cache.set(cache_key, activities)
    return activities
