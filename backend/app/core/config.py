from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # As URLs base de cada fonte (Câmara/Senado/TSE) e os TTLs de cache vivem
    # como constantes dentro de cada services/*_service.py, não aqui — os
    # campos que existiam pra isso (tse_base_url, camara_base_url,
    # senado_base_url, cache_ttl_seconds, app_name, portal_transparencia_token)
    # nunca foram lidos em lugar nenhum do código (achado da auditoria de
    # código, F-49). `debug` é o único campo desta classe realmente usado
    # (gate de /docs em app/api/__init__.py).
    debug: bool = False

    model_config = {"env_prefix": "APP_", "case_sensitive": False}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
