"""
Regressao de 2026-08-13 (revisao do Comparador pelo Aether, duas rodadas):

Rodada 1: a quebra por tipo de proposicao no comparador somava só a amostra
de 100 itens mais recentes (ex: REQ 53, PL 24...) enquanto o total exibido
ao lado vinha do link "last" da paginacao (ex: 3822) -- os dois numeros
pareciam se contradizer.

Rodada 2 (achado do Aether que invalidou a primeira correcao): a primeira
tentativa buscava a contagem real só para os tipos que apareciam na amostra
de 100 mais recentes (ordenados por ano). Isso falhava exatamente pro caso
mais importante -- comparando Arthur Lira x Adriana Ventura, a soma por tipo
ficava mais de 50% abaixo do total pros dois, e o tipo ausente era RIC, o
MAIS numeroso da Adriana (2000+ concentrados em 2023, nada depois). Um tipo
concentrado fora da janela de 100 mais recentes fica totalmente invisivel,
nao "raro" como a ressalva dizia.

Correcao definitiva: get_deputado_proposicoes_por_tipo pagina o historico
INTEIRO do deputado (nao deriva a lista de tipos de amostra nenhuma) e conta
por tipo em cada pagina -- a soma sempre bate com o total, nao importa em
que ano um tipo esteja concentrado.
"""
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    camara_service._cache.clear()
    camara_service._cache_proposicoes_por_tipo.clear()
    yield
    camara_service._cache.clear()
    camara_service._cache_proposicoes_por_tipo.clear()


def _item(sigla_tipo):
    return {"siglaTipo": sigla_tipo}


async def test_uma_pagina_conta_direto_sem_chamada_extra(monkeypatch):
    async def fake_fetch(path, params=None):
        return {
            "dados": [_item("REQ")] * 53 + [_item("PL")] * 24,
            "links": [{"rel": "self", "href": "https://x/proposicoes?pagina=1"}],
        }

    calls = []

    async def fake_pagina(client, params, pagina):
        calls.append(pagina)
        return []

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "_fetch_proposicoes_pagina", fake_pagina)

    resultado = await camara_service.get_deputado_proposicoes_por_tipo(1)

    assert resultado == {"REQ": 53, "PL": 24}
    assert calls == []  # nenhuma página extra buscada


async def test_tipo_concentrado_fora_da_primeira_pagina_nao_fica_ausente(monkeypatch):
    """O caso exato reportado: um tipo (RIC) concentrado inteiramente numa
    página que não é a primeira (ordenada por ano) não pode desaparecer da
    contagem -- a soma final tem que bater com o total real."""

    async def fake_fetch(path, params=None):
        return {
            "dados": [_item("PL")] * 100,  # página 1: só PL (anos recentes)
            "links": [{"rel": "last", "href": "https://x/proposicoes?pagina=3&itens=100"}],
        }

    async def fake_pagina(client, params, pagina):
        if pagina == 2:
            return [_item("RIC")] * 100  # RIC concentrado aqui, fora da amostra de 100 recentes
        if pagina == 3:
            return [_item("RIC")] * 22
        return []

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "_fetch_proposicoes_pagina", fake_pagina)

    resultado = await camara_service.get_deputado_proposicoes_por_tipo(204528)

    assert resultado["PL"] == 100
    assert resultado["RIC"] == 122  # não fica ausente nem sub-representado
    assert sum(resultado.values()) == 222


async def test_resultado_fica_em_cache(monkeypatch):
    calls = {"n": 0}

    async def fake_fetch(path, params=None):
        calls["n"] += 1
        return {"dados": [_item("PL")] * 10, "links": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    await camara_service.get_deputado_proposicoes_por_tipo(1)
    await camara_service.get_deputado_proposicoes_por_tipo(1)

    assert calls["n"] == 1
