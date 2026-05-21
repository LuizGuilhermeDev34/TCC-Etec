import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .v1 import router as api_v1_router

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(title="Democratização de Dados - Backend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_v1_router, prefix="/api")

    @app.on_event("startup")
    async def _prewarm_tse() -> None:
        """Baixa os ZIPs do TSE em background no startup para que a primeira
        requisição de patrimônio não espere 30–90 segundos."""
        from .v1.endpoints.patrimonio import (
            get_patrimonio_deputado_federal as _unused,  # noqa: F401
        )
        from ..services.tse_service import _ensure_indices

        async def _run() -> None:
            try:
                await _ensure_indices()
                logger.info("TSE indices carregados com sucesso.")
            except Exception as exc:
                logger.warning("Falha ao pré-carregar TSE: %s", exc)

        asyncio.create_task(_run())

    return app
