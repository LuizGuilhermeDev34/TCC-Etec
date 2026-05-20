from fastapi import APIRouter
from .endpoints.activities import router as activity_router
from .endpoints.camara import router as camara_router
from .endpoints.comparar import router as comparar_router
from .endpoints.senado import router as senado_router
from .endpoints.estadual import router as estadual_router
from .endpoints.patrimonio import router as patrimonio_router

router = APIRouter(prefix="/v1")
router.include_router(activity_router)
router.include_router(camara_router)
router.include_router(comparar_router)
router.include_router(senado_router)
router.include_router(estadual_router)
router.include_router(patrimonio_router)
