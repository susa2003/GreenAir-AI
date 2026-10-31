from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.predictions import router as predictions_router
from backend.app.api.datasets import router as datasets_router
from backend.app.api.analysis import router as analysis_router
from backend.app.api.reports import router as reports_router
from backend.app.api.chat import router as chat_router
from backend.app.api.history import router as history_router
from backend.app.api.locations import router as locations_router
from backend.app.api.industrial import router as industrial_router
from backend.app.api.datagov import router as datagov_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(predictions_router)
api_router.include_router(datasets_router)
api_router.include_router(analysis_router)
api_router.include_router(reports_router)
api_router.include_router(chat_router)
api_router.include_router(history_router)
api_router.include_router(locations_router)
api_router.include_router(industrial_router)
api_router.include_router(datagov_router)

__all__ = ["api_router"]
