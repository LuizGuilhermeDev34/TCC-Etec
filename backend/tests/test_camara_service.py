"""
Regressao para o bug de 2026-08-11: get_votacao_votos mandava itens=513 pro
sub-endpoint /votos, que a API da Camara rejeita com 400 (diferente de
/votacoes e /proposicoes, que aceitam itens). O try/except genérico que
existia engolia esse erro e devolvia {"total": 0}, fazendo o frontend
afirmar "votacao simbolica - sem registro individual" em votacoes que na
verdade tinham centenas de votos nominais.
"""
import httpx
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    camara_service._cache.clear()
    yield
    camara_service._cache.clear()


async def test_nao_envia_itens_para_o_endpoint_de_votos(monkeypatch):
    captured = {}

    async def fake_fetch(path, params=None):
        captured["path"] = path
        captured["params"] = params
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    await camara_service.get_votacao_votos("123-45")

    assert captured["path"] == "/votacoes/123-45/votos"
    assert captured["params"] is None


async def test_agrega_votos_por_partido(monkeypatch):
    async def fake_fetch(path, params=None):
        return {
            "dados": [
                {"deputado_": {"siglaPartido": "PT"}, "tipoVoto": "Sim"},
                {"deputado_": {"siglaPartido": "PT"}, "tipoVoto": "Não"},
                {"deputado_": {"siglaPartido": "PL"}, "tipoVoto": "Sim"},
                {"deputado_": {"siglaPartido": "PL"}, "tipoVoto": "Abstenção"},
            ]
        }

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    result = await camara_service.get_votacao_votos("2525122-73")

    assert result["total"] == 4
    pt = next(p for p in result["partidos"] if p["sigla"] == "PT")
    pl = next(p for p in result["partidos"] if p["sigla"] == "PL")
    assert pt == {"sigla": "PT", "sim": 1, "nao": 1, "abstencao": 0, "outros": 0}
    assert pl == {"sigla": "PL", "sim": 1, "nao": 0, "abstencao": 1, "outros": 0}


async def test_votacao_genuinamente_simbolica_retorna_zero(monkeypatch):
    """Resposta 200 com dados vazio = votacao de comissao sem voto nominal
    registrado. Isso e um estado legitimo, nao um erro."""
    async def fake_fetch(path, params=None):
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    result = await camara_service.get_votacao_votos("2620930-22")

    assert result == {"total": 0, "partidos": []}


async def test_falha_real_da_api_nao_vira_falso_total_zero(monkeypatch):
    """O bug original: uma falha de verdade (400/503) era mascarada como
    'sem votos'. Agora tem que propagar para o router tratar (503)."""
    request = httpx.Request("GET", "https://dadosabertos.camara.leg.br/api/v2/votacoes/1/votos")
    response = httpx.Response(400, request=request)

    async def fake_fetch(path, params=None):
        raise httpx.HTTPStatusError("Bad Request", request=request, response=response)

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    with pytest.raises(httpx.HTTPStatusError):
        await camara_service.get_votacao_votos("1")
