"""
F-27 da auditoria de código: toda a suíte testava a camada de serviço
(camara_service) diretamente ou middlewares isolados — nenhum teste jamais
passava por uma rota real via TestClient. Isso deixava o roteamento em si
(validação de path/query, mapeamento de erro, serialização do response_model)
sem cobertura nas rotas onde os piores bugs desta rodada foram achados
(F-04 TSE, F-05 total_membros): detalhe de deputado, despesas, partidos
(lista/detalhe/liderança). Estes testes fecham essa lacuna mockando a
camada de serviço no ponto em que o módulo de endpoints a importa.
"""
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
import app.api.v1.endpoints.camara as camara_endpoints

client = TestClient(app)


def _http_404():
    request = httpx.Request("GET", "https://dadosabertos.camara.leg.br/api/v2/x")
    response = httpx.Response(404, request=request)
    return httpx.HTTPStatusError("erro", request=request, response=response)


def test_deputado_detail_serializa_campos_reais(monkeypatch):
    async def fake_detail(deputado_id):
        assert deputado_id == 204379
        return {
            "id": 204379,
            "nome": "Fulana de Tal",
            "nome_civil": "Fulana de Tal Silva",
            "sigla_partido": "AB",
            "sigla_uf": "SP",
            "id_legislatura": 57,
            "url_foto": None,
            "email": None,
            "sexo": "F",
            "data_nascimento": None,
            "uf_nascimento": None,
            "municipio_nascimento": None,
            "escolaridade": None,
            "url_website": None,
            "redes_sociais": [],
            "descricao_status": None,
            "gabinete": None,
            "biografia": None,
        }

    monkeypatch.setattr(camara_endpoints, "get_deputado_detail", fake_detail)

    resp = client.get("/api/v1/camara/deputados/204379")

    assert resp.status_code == 200
    assert resp.json()["nome"] == "Fulana de Tal"
    assert resp.json()["sigla_partido"] == "AB"


def test_deputado_detail_404_da_camara_vira_404_na_rota(monkeypatch):
    async def fake_detail(deputado_id):
        raise _http_404()

    monkeypatch.setattr(camara_endpoints, "get_deputado_detail", fake_detail)

    resp = client.get("/api/v1/camara/deputados/999999")

    assert resp.status_code == 404


def test_deputado_id_invalido_e_rejeitado_antes_do_service(monkeypatch):
    called = False

    async def fake_detail(deputado_id):
        nonlocal called
        called = True
        return {}

    monkeypatch.setattr(camara_endpoints, "get_deputado_detail", fake_detail)

    resp = client.get("/api/v1/camara/deputados/0")

    assert resp.status_code == 422
    assert called is False


def test_despesas_repassa_o_ano_da_query(monkeypatch):
    captured = {}

    async def fake_despesas(deputado_id, ano=2025):
        captured["deputado_id"] = deputado_id
        captured["ano"] = ano
        return []

    monkeypatch.setattr(camara_endpoints, "get_deputado_despesas", fake_despesas)

    resp = client.get("/api/v1/camara/deputados/204379/despesas?ano=2023")

    assert resp.status_code == 200
    assert resp.json() == []
    assert captured == {"deputado_id": 204379, "ano": 2023}


def test_partidos_retorna_lista_do_service(monkeypatch):
    async def fake_partidos():
        return [{"id": 1, "sigla": "AB", "nome": "Partido AB", "totalMembros": 9}]

    monkeypatch.setattr(camara_endpoints, "get_partidos", fake_partidos)

    resp = client.get("/api/v1/camara/partidos")

    assert resp.status_code == 200
    assert resp.json() == [{"id": 1, "sigla": "AB", "nome": "Partido AB", "totalMembros": 9}]


def test_partido_detail_404_quando_service_retorna_none(monkeypatch):
    async def fake_partido_by_id(partido_id):
        return None

    monkeypatch.setattr(camara_endpoints, "get_partido_by_id", fake_partido_by_id)

    resp = client.get("/api/v1/camara/partidos/1")

    assert resp.status_code == 404


def test_partido_detail_200_quando_encontrado(monkeypatch):
    async def fake_partido_by_id(partido_id):
        return {"id": partido_id, "sigla": "AB", "nome": "Partido AB"}

    monkeypatch.setattr(camara_endpoints, "get_partido_by_id", fake_partido_by_id)

    resp = client.get("/api/v1/camara/partidos/42")

    assert resp.status_code == 200
    assert resp.json()["sigla"] == "AB"


def test_partido_lideranca_repassa_payload_do_service(monkeypatch):
    async def fake_lideranca(partido_id):
        return {"popularidade_camara": 12, "lider_camara": None, "presidente": None}

    monkeypatch.setattr(camara_endpoints, "get_partido_lideranca", fake_lideranca)

    resp = client.get("/api/v1/camara/partidos/42/lideranca")

    assert resp.status_code == 200
    assert resp.json()["popularidade_camara"] == 12


def test_partido_gastos_indisponibilidade_da_camara_vira_503(monkeypatch):
    async def fake_gastos(partido_id):
        raise httpx.ConnectTimeout("timeout")

    monkeypatch.setattr(camara_endpoints, "get_partido_gastos", fake_gastos)

    resp = client.get("/api/v1/camara/partidos/42/gastos")

    assert resp.status_code == 503
