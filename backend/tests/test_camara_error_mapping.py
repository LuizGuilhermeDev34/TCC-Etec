"""
Regressao de 2026-08-20: GET /api/v1/camara/deputados/999999 (ID inexistente)
devolvia 503 "Servico da Camara indisponivel" -- a Camara respondeu 404 (o
deputado nao existe), nao uma falha de conexao, mas todo `except
HTTPStatusError` nos endpoints tratava qualquer status de erro como
indisponibilidade generica. _raise_camara_error agora distingue os dois
casos.
"""
import httpx
import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.camara import _raise_camara_error


def _http_status_error(status_code: int) -> httpx.HTTPStatusError:
    request = httpx.Request("GET", "https://dadosabertos.camara.leg.br/api/v2/deputados/999999")
    response = httpx.Response(status_code, request=request)
    return httpx.HTTPStatusError("erro", request=request, response=response)


def test_404_da_camara_vira_404_nao_503():
    with pytest.raises(HTTPException) as exc_info:
        _raise_camara_error(_http_status_error(404))
    assert exc_info.value.status_code == 404


def test_500_da_camara_vira_503():
    with pytest.raises(HTTPException) as exc_info:
        _raise_camara_error(_http_status_error(500))
    assert exc_info.value.status_code == 503


def test_400_da_camara_tambem_vira_503_nao_404():
    with pytest.raises(HTTPException) as exc_info:
        _raise_camara_error(_http_status_error(400))
    assert exc_info.value.status_code == 503
