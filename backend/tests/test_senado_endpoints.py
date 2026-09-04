"""
F-27 da auditoria de código: as rotas /senado/* nunca foram exercitadas via
TestClient — só a camada de serviço (senado_service) tinha teste, em nenhum
lugar do arquivo original. Mesma lacuna do /camara: nada garantia que a rota
mapeava query/path corretamente nem que um erro do Senado virava 503 (não um
500 cru).
"""
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
import app.api.v1.endpoints.senado as senado_endpoints

client = TestClient(app)


def test_senadores_retorna_lista_do_service(monkeypatch):
    async def fake_senadores():
        return [
            {
                "codigo": "123",
                "nome": "Fulana",
                "nome_completo": "Fulana da Silva",
                "sexo": "F",
                "partido": "AB",
                "uf": "SP",
            }
        ]

    monkeypatch.setattr(senado_endpoints, "get_senadores", fake_senadores)

    resp = client.get("/api/v1/senado/senadores")

    assert resp.status_code == 200
    assert resp.json()[0]["codigo"] == "123"


def test_senadores_erro_do_senado_vira_503_nao_500_cru(monkeypatch):
    async def fake_senadores():
        raise httpx.ConnectTimeout("timeout")

    monkeypatch.setattr(senado_endpoints, "get_senadores", fake_senadores)

    resp = client.get("/api/v1/senado/senadores")

    assert resp.status_code == 503


def test_senador_votacoes_repassa_data_inicio(monkeypatch):
    captured = {}

    async def fake_votacoes(codigo, data_inicio=None):
        captured["codigo"] = codigo
        captured["data_inicio"] = data_inicio
        return []

    monkeypatch.setattr(senado_endpoints, "get_senador_votacoes", fake_votacoes)

    resp = client.get("/api/v1/senado/senadores/123/votacoes?data_inicio=2026-01-01")

    assert resp.status_code == 200
    assert captured == {"codigo": "123", "data_inicio": "2026-01-01"}


def test_senador_votacoes_xml_malformado_vira_503_nao_500_cru(monkeypatch):
    import xml.etree.ElementTree as ET

    async def fake_votacoes(codigo, data_inicio=None):
        raise ET.ParseError("xml malformado")

    monkeypatch.setattr(senado_endpoints, "get_senador_votacoes", fake_votacoes)

    resp = client.get("/api/v1/senado/senadores/123/votacoes")

    assert resp.status_code == 503


def test_senador_votacoes_codigo_com_caractere_invalido_e_rejeitado(monkeypatch):
    called = False

    async def fake_votacoes(codigo, data_inicio=None):
        nonlocal called
        called = True
        return []

    monkeypatch.setattr(senado_endpoints, "get_senador_votacoes", fake_votacoes)

    resp = client.get("/api/v1/senado/senadores/abc_123/votacoes")

    assert resp.status_code == 422
    assert called is False
