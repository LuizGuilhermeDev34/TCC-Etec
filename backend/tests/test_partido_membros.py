"""
Regressao de 2026-09-03 (F-03 da auditoria de codigo): totalMembros devolvido
pela API da Camara em /partidos nao corresponde a contagem real de deputados
em exercicio -- confirmado ao vivo: DC aparecia com 0 (tem 1 deputado real,
Jose Carlos Araujo-BA) e PDT com 10 (tem 9). get_partidos, get_partido_by_id
e get_partido_lideranca usavam esse campo cru em tres lugares diferentes sem
nunca recalcular contra get_deputados(), ja buscada e cacheada em outro
lugar do proprio sistema.
"""
import pytest

from app.models import Deputado
from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    camara_service._cache.clear()
    camara_service._cache_deputados.clear()
    yield
    camara_service._cache.clear()
    camara_service._cache_deputados.clear()


def _dep(id_, sigla_partido, uf="SP"):
    return Deputado(id=id_, nome=f"Dep {id_}", sigla_partido=sigla_partido, sigla_uf=uf, id_legislatura=57)


async def test_get_partidos_recalcula_total_membros_da_lista_real(monkeypatch):
    async def fake_fetch(path, params=None):
        if path == "/partidos":
            return {"dados": [{"id": 1, "sigla": "DC"}, {"id": 2, "sigla": "PDT"}]}
        return {"dados": {}}

    async def fake_detail(client, partido_id):
        # simula o campo cru da Camara, propositalmente errado
        if partido_id == 1:
            return {"id": 1, "sigla": "DC", "nome": "Democracia Crista", "totalMembros": 0, "totalPosse": 0, "lider": None}
        return {"id": 2, "sigla": "PDT", "nome": "PDT", "totalMembros": 10, "totalPosse": 16, "lider": None}

    async def fake_deputados():
        return [_dep(1, "DC"), _dep(2, "PDT"), _dep(3, "PDT")]

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "_fetch_partido_detail", fake_detail)
    monkeypatch.setattr(camara_service, "get_deputados", fake_deputados)

    partidos = await camara_service.get_partidos()

    by_sigla = {p["sigla"]: p for p in partidos}
    assert by_sigla["DC"]["totalMembros"] == 1
    assert by_sigla["PDT"]["totalMembros"] == 2


async def test_get_partido_by_id_fallback_recalcula_total_membros(monkeypatch):
    async def fake_fetch(path, params=None):
        return {"dados": {"id": 5, "sigla": "DC", "nome": "Democracia Crista",
                           "status": {"totalMembros": "0", "totalPosse": "0"}}}

    async def fake_deputados():
        return [_dep(10, "DC")]

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "get_deputados", fake_deputados)

    partido = await camara_service.get_partido_by_id(5)

    assert partido["totalMembros"] == 1


async def test_get_partido_lideranca_usa_contagem_real_nao_campo_cru(monkeypatch):
    async def fake_get_partido(partido_id):
        return {"sigla": "PDT", "totalMembros": 10, "lider": None}

    async def fake_deputados():
        return [_dep(1, "PDT"), _dep(2, "PDT")]

    async def fake_senadores():
        return []

    async def _none(*a, **k):
        return None

    monkeypatch.setattr(camara_service, "get_partido_by_id", fake_get_partido)
    monkeypatch.setattr(camara_service, "get_deputados", fake_deputados)
    monkeypatch.setattr(camara_service, "get_summary", _none)
    monkeypatch.setattr(camara_service, "get_pageviews", _none)

    import app.services.senado_service as senado_service
    monkeypatch.setattr(senado_service, "get_senadores", fake_senadores)

    result = await camara_service.get_partido_lideranca(1)

    # 2 deputados reais de 513, nao os 10 do campo cru
    assert result["popularidade_camara"] == round((2 / 513) * 100, 1)
