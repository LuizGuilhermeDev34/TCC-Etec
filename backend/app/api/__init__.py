from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..core import RateLimitMiddleware
from ..core.config import get_settings
from .v1 import router as api_v1_router


def create_app() -> FastAPI:
    settings = get_settings()
    # /docs, /redoc e /openapi.json mapeiam as 22 rotas da API publicamente,
    # sem autenticação — inclusive rotas que já saíram do frontend (ver
    # rotas de estaduais). Só expõe em desenvolvimento (APP_DEBUG=true).
    docs_kwargs = (
        {}
        if settings.debug
        else {"docs_url": None, "redoc_url": None, "openapi_url": None}
    )
    app = FastAPI(title="Democratização de Dados - Backend", **docs_kwargs)

    # 60/min medido na prática: uma única página (perfil de partido, por
    # exemplo) já dispara 5+ chamadas simultâneas, e o painel de votações
    # refaz uma a cada 15 min. Em wifi compartilhado (várias pessoas atrás do
    # mesmo IP), 60/min estoura em segundos — e ao estourar, a tela mostrava
    # "não foi possível conectar à API da Câmara", acusando a fonte errada
    # por uma decisão nossa. Subido para 300/min, ainda protege contra abuso
    # real sem punir uso normal com múltiplas abas/pessoas.
    app.add_middleware(RateLimitMiddleware, limit=300, window_seconds=60)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_v1_router, prefix="/api")

    return app
