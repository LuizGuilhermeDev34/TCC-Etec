"""
Regressao de 2026-09-03 (F-16 da auditoria de codigo): a API nao adicionava
nenhum header de seguranca alem do content-type default do FastAPI/Starlette
-- confirmado ao vivo (curl mostrando so content-type/content-length em toda
resposta).
"""
from starlette.requests import Request
from starlette.responses import PlainTextResponse

from app.core.security_headers import SecurityHeadersMiddleware


def _request() -> Request:
    scope = {"type": "http", "client": ("1.2.3.4", 12345), "headers": []}
    return Request(scope)


async def test_adiciona_headers_de_seguranca_basicos():
    mw = SecurityHeadersMiddleware(app=None)

    async def call_next(request):
        return PlainTextResponse("ok")

    response = await mw.dispatch(_request(), call_next)

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "max-age" in response.headers["Strict-Transport-Security"]


async def test_headers_aplicam_mesmo_em_resposta_de_erro():
    mw = SecurityHeadersMiddleware(app=None)

    async def call_next(request):
        return PlainTextResponse("erro", status_code=503)

    response = await mw.dispatch(_request(), call_next)

    assert response.status_code == 503
    assert response.headers["X-Content-Type-Options"] == "nosniff"
