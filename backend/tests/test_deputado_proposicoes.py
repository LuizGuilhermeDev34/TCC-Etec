"""
Regressão de 2026-08-12: get_deputado_proposicoes pedia itens=100 (teto de
página) e devolvia isso como se fosse o total do deputado — confirmado ao
vivo que uma deputada tinha 3822 proposições reais (majoritariamente RIC),
mostrando só "100" sem indicar que havia milhares a mais. A Câmara expõe o
total real via o link "last" da paginação; uma segunda chamada a essa
página dá a contagem exata sem baixar tudo.

Também corrige a falta de órgão nos requerimentos: sem ele, REQs de
comissões diferentes com o mesmo número (cada comissão numera a própria
série) parecem duplicatas.
"""
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    camara_service._cache.clear()
    yield
    camara_service._cache.clear()


def _prop_item(id_, sigla="PL", numero=1, ano=2026):
    return {
        "id": id_, "siglaTipo": sigla, "numero": numero, "ano": ano,
        "ementa": "Ementa de teste", "dataApresentacao": "2026-01-01T10:00",
    }


async def test_total_vem_do_link_last_quando_ha_mais_de_uma_pagina(monkeypatch):
    async def fake_fetch(path, params=None):
        if params and params.get("pagina") == 39:
            return {"dados": [_prop_item(i) for i in range(22)], "links": []}
        return {
            "dados": [_prop_item(i) for i in range(100)],
            "links": [
                {"rel": "self", "href": "https://x/proposicoes?pagina=1"},
                {"rel": "last", "href": "https://x/proposicoes?idDeputadoAutor=1&pagina=39&itens=100"},
            ],
        }

    async def fake_status(client, prop_id):
        return prop_id, None, None

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "_fetch_proposicao_status", fake_status)

    proposicoes, total = await camara_service.get_deputado_proposicoes(204528)

    assert len(proposicoes) == 100
    assert total == 38 * 100 + 22  # 3822


async def test_total_igual_ao_carregado_quando_so_uma_pagina(monkeypatch):
    async def fake_fetch(path, params=None):
        return {
            "dados": [_prop_item(i) for i in range(12)],
            "links": [{"rel": "self", "href": "https://x/proposicoes?pagina=1"}],
        }

    async def fake_status(client, prop_id):
        return prop_id, None, None

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "_fetch_proposicao_status", fake_status)

    proposicoes, total = await camara_service.get_deputado_proposicoes(1)

    assert total == 12 == len(proposicoes)


async def test_enriquece_so_as_primeiras_N_com_orgao(monkeypatch):
    """Enriquecer as 100 traria de volta o mesmo problema de latência do
    enriquecimento de votações — só as mais recentes (as visíveis primeiro
    na tela) recebem o órgão."""
    async def fake_fetch(path, params=None):
        return {"dados": [_prop_item(i, sigla="REQ", numero=i) for i in range(30)], "links": []}

    calls = []

    async def fake_status(client, prop_id):
        calls.append(prop_id)
        return prop_id, "Aguardando Parecer", "CSPCCO"

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "_fetch_proposicao_status", fake_status)

    proposicoes, _ = await camara_service.get_deputado_proposicoes(1)

    assert len(calls) == camara_service._ENRIQUECER_PRIMEIRAS_N
    enriquecidas = [p for p in proposicoes if p.orgao_situacao]
    assert len(enriquecidas) == camara_service._ENRIQUECER_PRIMEIRAS_N
