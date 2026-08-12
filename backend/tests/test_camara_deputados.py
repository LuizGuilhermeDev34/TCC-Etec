"""
Regressão de 2026-08-11: get_deputados mandava idLegislatura=57 (a legislatura
corrente) pro endpoint /deputados. Confirmado ao vivo contra a API real da
Câmara que esse parâmetro devolve um recorte incompleto nesse modo — 384 de
513 deputados no total, 46 de 70 só em SP — provavelmente por não refletir
substituições por suplência. Sem o parâmetro, a Câmara devolve a composição
atual completa (513, zero duplicata). A correção só envia idLegislatura
quando é uma legislatura explicitamente diferente da corrente.
"""
from app.services import camara_service


async def test_legislatura_corrente_nao_envia_idLegislatura(monkeypatch):
    captured = {}

    async def fake_fetch(path, params=None):
        captured["params"] = params
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    camara_service._cache.clear()

    await camara_service.get_deputados(legislatura=camara_service._LEGISLATURA_ATUAL)

    assert "idLegislatura" not in captured["params"]
    assert captured["params"]["itens"] == 513


async def test_legislatura_historica_envia_idLegislatura(monkeypatch):
    captured = {}

    async def fake_fetch(path, params=None):
        captured["params"] = params
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    camara_service._cache.clear()

    await camara_service.get_deputados(legislatura=56)

    assert captured["params"]["idLegislatura"] == 56
