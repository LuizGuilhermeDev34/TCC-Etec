from functools import lru_cache
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    tse_base_url: AnyHttpUrl = "https://api.tse.jus.br"
    camara_base_url: AnyHttpUrl = "https://dadosabertos.camara.leg.br/api/v2"
    senado_base_url: AnyHttpUrl = "https://legis.senado.leg.br/dadosabertos"
    portal_transparencia_token: str = ""
    cache_ttl_seconds: int = 300
    debug: bool = False
    app_name: str = "democratizacao-dados"

    model_config = {"env_prefix": "APP_", "case_sensitive": False}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
