"""
Achado da auditoria de 2026-08-20: ao estourar o limite, a resposta 429 nao
tinha Retry-After (o visitante nao sabia quanto esperar) e o limite de
60/min era baixo demais pra uso normal com varias abas/pessoas atras do
mesmo IP (uma unica pagina de partido ja dispara 5+ chamadas simultaneas).
Ambos corrigidos; estes testes cobrem o comportamento do middleware
isoladamente.
"""
import pytest
from starlette.requests import Request

from app.core.rate_limit import RateLimitMiddleware


def _request(ip: str = "1.2.3.4") -> Request:
    scope = {"type": "http", "client": (ip, 12345), "headers": []}
    return Request(scope)


async def test_permite_ate_o_limite_depois_bloqueia_com_429():
    mw = RateLimitMiddleware(app=None, limit=3, window_seconds=60)

    async def call_next(request):
        return "ok"

    req = _request()
    for _ in range(3):
        assert await mw.dispatch(req, call_next) == "ok"

    blocked = await mw.dispatch(req, call_next)
    assert blocked.status_code == 429


async def test_resposta_429_tem_retry_after():
    mw = RateLimitMiddleware(app=None, limit=1, window_seconds=60)

    async def call_next(request):
        return "ok"

    req = _request()
    await mw.dispatch(req, call_next)
    blocked = await mw.dispatch(req, call_next)

    assert "retry-after" in blocked.headers
    assert int(blocked.headers["retry-after"]) > 0


async def test_ips_diferentes_tem_contadores_independentes():
    mw = RateLimitMiddleware(app=None, limit=1, window_seconds=60)

    async def call_next(request):
        return "ok"

    assert await mw.dispatch(_request("1.1.1.1"), call_next) == "ok"
    assert await mw.dispatch(_request("2.2.2.2"), call_next) == "ok"
