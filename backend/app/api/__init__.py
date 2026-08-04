from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .v1 import router as api_v1_router


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

    return app
