from fastapi import APIRouter
from .endpoints.activities import router as activity_router
from .endpoints.camara import router as camara_router
from .endpoints.comparar import router as comparar_router
from .endpoints.senado import router as senado_router
from .endpoints.patrimonio import router as patrimonio_router

# Escopo do TCC é federal (Câmara, Senado, TSE) — estaduais foi descartado
# (ver App.tsx). O router de estaduais fica FORA daqui de propósito: mesmo
# sem o frontend chamando, ele continuava respondendo em produção com dados
# hardcoded, e com /docs público qualquer um o encontrava em segundos.
# `endpoints/estadual.py` e `services/estadual_service.py` seguem no repo,
# não roteados, caso o grupo retome depois da banca.
router = APIRouter(prefix="/v1")
router.include_router(activity_router)
router.include_router(camara_router)
router.include_router(comparar_router)
router.include_router(senado_router)
router.include_router(patrimonio_router)
