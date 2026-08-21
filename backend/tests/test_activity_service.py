"""
Regressão de 2026-08-12: get_recent_activities buscava votações com
itens=30 e sem data_fim, depois cortava pra [:20] antes de expor pro
front. A home usava esse feed pra calcular "Aprovadas"/"Rejeitadas" dos
últimos 30 dias — o corte artificial fazia o painel mostrar sempre os 20
registros mais recentes (não uma amostra representativa do período), e
sem nenhuma separação mérito/procedural, então "20 aprovadas, 0
rejeitadas" parecia (e não era) a taxa real de aprovação do Congresso.
"""
import pytest

from app.services import activity_service, camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    activity_service._cache.clear()
    yield
    activity_service._cache.clear()


def _votacao(vid: str, aprovacao: int, merito: bool):
    from app.models.votacao import Votacao
    return Votacao(
        id=vid,
        data="2026-08-01",
        data_hora_registro="2026-08-01T10:00:00",
        sigla_orgao="PLEN",
        proposicao_objeto=None,
        descricao="Aprovado o Parecer." if not merito else "Aprovado o Projeto de Lei.",
        aprovacao=aprovacao,
        merito=merito,
    )


async def test_nao_corta_votacoes_em_20(monkeypatch):
    votacoes = [_votacao(str(i), 1, True) for i in range(45)]

    async def fake_get_votacoes(itens, data_inicio, data_fim):
        return votacoes

    async def fake_get_proposicoes(ano, tipo, itens):
        return [], 0

    monkeypatch.setattr(activity_service, "get_votacoes_recentes", fake_get_votacoes)
    monkeypatch.setattr(activity_service, "get_proposicoes", fake_get_proposicoes)

    activities = await activity_service.get_recent_activities()

    assert len(activities) == 45


async def test_pede_ate_100_itens_e_envia_data_fim(monkeypatch):
    captured = {}

    async def fake_get_votacoes(itens, data_inicio, data_fim):
        captured["itens"] = itens
        captured["data_fim"] = data_fim
        return []

    async def fake_get_proposicoes(ano, tipo, itens):
        return [], 0

    monkeypatch.setattr(activity_service, "get_votacoes_recentes", fake_get_votacoes)
    monkeypatch.setattr(activity_service, "get_proposicoes", fake_get_proposicoes)

    await activity_service.get_recent_activities()

    assert captured["itens"] == 100
    assert captured["data_fim"] is not None


async def test_repassa_merito_para_a_activity(monkeypatch):
    votacoes = [_votacao("1", 1, True), _votacao("2", 1, False)]

    async def fake_get_votacoes(itens, data_inicio, data_fim):
        return votacoes

    async def fake_get_proposicoes(ano, tipo, itens):
        return [], 0

    monkeypatch.setattr(activity_service, "get_votacoes_recentes", fake_get_votacoes)
    monkeypatch.setattr(activity_service, "get_proposicoes", fake_get_proposicoes)

    activities = await activity_service.get_recent_activities()

    by_id = {a.votacao_id: a for a in activities}
    assert by_id["1"].merito is True
    assert by_id["2"].merito is False
