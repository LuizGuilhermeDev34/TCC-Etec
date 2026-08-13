"""
Regressao de 2026-08-13 (revisao do Comparador pelo Aether): a quebra por
tipo de proposicao no comparador somava só a amostra de 100 itens mais
recentes (ex: REQ 53, PL 24...) enquanto o total exibido ao lado vinha do
link "last" da paginacao (ex: 3822) -- os dois numeros pareciam se
contradizer. Aether sugeriu reaproveitar o mesmo truque do link "last" por
tipo, em vez de só anexar uma ressalva de amostra. get_deputado_proposicoes_por_tipo
faz uma chamada por tipo (filtrada por siglaTipo) e usa o link "last" pra
obter a contagem REAL daquele tipo -- na pratica quase sempre uma chamada só,
já que um tipo isolado raramente passa de 100 itens.
"""
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    camara_service._cache.clear()
    yield
    camara_service._cache.clear()


class _FakeResponse:
    def __init__(self, dados, links=None):
        self.is_success = True
        self._dados = dados
        self._links = links or []

    def json(self):
        return {"dados": self._dados, "links": self._links}


class _FakeClient:
    def __init__(self, first_page, last_page=None):
        self._first_page = first_page
        self._last_page = last_page
        self.calls = 0

    async def get(self, url, params=None, timeout=None):
        self.calls += 1
        if params.get("pagina"):
            return _FakeResponse(self._last_page)
        return _FakeResponse(self._first_page["dados"], self._first_page.get("links", []))


async def test_fetch_tipo_total_uma_pagina_nao_precisa_de_segunda_chamada():
    client = _FakeClient(first_page={"dados": [{"id": i} for i in range(53)], "links": []})

    sigla, total = await camara_service._fetch_proposicao_tipo_total(client, 204528, "REQ")

    assert sigla == "REQ"
    assert total == 53
    assert client.calls == 1


async def test_fetch_tipo_total_com_mais_de_100_usa_link_last():
    client = _FakeClient(
        first_page={
            "dados": [{"id": i} for i in range(100)],
            "links": [{"rel": "last", "href": "https://x/proposicoes?siglaTipo=RIC&pagina=32&itens=100"}],
        },
        last_page=[{"id": i} for i in range(15)],
    )

    sigla, total = await camara_service._fetch_proposicao_tipo_total(client, 204528, "RIC")

    assert sigla == "RIC"
    assert total == 31 * 100 + 15  # 3115
    assert client.calls == 2


async def test_get_deputado_proposicoes_por_tipo_agrega_varios_tipos(monkeypatch):
    async def fake_fetch(client, deputado_id, sigla_tipo):
        return sigla_tipo, {"REQ": 53, "PL": 24, "RIC": 3115}[sigla_tipo]

    monkeypatch.setattr(camara_service, "_fetch_proposicao_tipo_total", fake_fetch)

    resultado = await camara_service.get_deputado_proposicoes_por_tipo(204528, ["REQ", "PL", "RIC"])

    assert resultado == {"REQ": 53, "PL": 24, "RIC": 3115}


async def test_get_deputado_proposicoes_por_tipo_lista_vazia_nao_chama_nada(monkeypatch):
    calls = []

    async def fake_fetch(client, deputado_id, sigla_tipo):
        calls.append(sigla_tipo)
        return sigla_tipo, 0

    monkeypatch.setattr(camara_service, "_fetch_proposicao_tipo_total", fake_fetch)

    resultado = await camara_service.get_deputado_proposicoes_por_tipo(1, [])

    assert resultado == {}
    assert calls == []
