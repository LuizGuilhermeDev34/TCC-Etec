"""
Regressão de 2026-08-11: get_deputados mandava idLegislatura=57 (a legislatura
corrente) pro endpoint /deputados. Esse parâmetro faz a Câmara devolver uma
linha por período de filiação partidária — quem trocou de legenda aparece
duas vezes — e essas duplicatas consomem o teto itens=513 antes de cobrir os
513 deputados reais: dedup por id sobrava com só 384 pessoas (SP: 46 de 70,
confirmado ao vivo contra a API real). Sem o parâmetro, a Câmara já devolve a
composição atual sem duplicata nenhuma. A correção só envia idLegislatura
quando é uma legislatura explicitamente diferente da corrente.
"""
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    camara_service._cache_deputados.clear()
    yield
    camara_service._cache_deputados.clear()


async def test_legislatura_corrente_nao_envia_idLegislatura(monkeypatch):
    captured = {}

    async def fake_fetch(path, params=None):
        captured["params"] = params
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    await camara_service.get_deputados(legislatura=camara_service._LEGISLATURA_ATUAL)

    assert "idLegislatura" not in captured["params"]
    assert captured["params"]["itens"] == 513


async def test_legislatura_historica_envia_idLegislatura(monkeypatch):
    captured = {}

    async def fake_fetch(path, params=None):
        captured["params"] = params
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    await camara_service.get_deputados(legislatura=56)

    assert captured["params"]["idLegislatura"] == 56


async def test_uf_repassa_siglaUf_maiuscula(monkeypatch):
    captured = {}

    async def fake_fetch(path, params=None):
        captured["params"] = params
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    await camara_service.get_deputados(uf="sp")

    assert captured["params"]["siglaUf"] == "SP"


async def test_sem_uf_nao_envia_siglaUf(monkeypatch):
    captured = {}

    async def fake_fetch(path, params=None):
        captured["params"] = params
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    await camara_service.get_deputados()

    assert "siglaUf" not in captured["params"]
