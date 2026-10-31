import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database.connection import init_db
from backend.app.services.ml_service import ml_service
from backend.app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("greenair")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler: initialize DB, warm model, check paths."""
    logger.info("Initializing GreenAir AI Agent backend...")
    init_db()
    logger.info(f"Database initialized at: {settings.DATABASE_PATH}")

    # Warm-load model
    if ml_service.is_loaded:
        logger.info(f"ML Model '{ml_service.model_type}' ready with classes: {ml_service.classes}")
    else:
        logger.warning("ML Model is operating in fallback rule-based mode.")

    yield
    logger.info("Shutting down GreenAir AI Agent backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Air Quality Intelligence, Environmental Analytics & Decision Support Platform",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Sanitize internal errors to prevent exposing internal stack traces or paths."""
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred while processing the environmental data request."},
    )

# Static frontend serving if dist exists
FRONTEND_DIST = settings.WORKSPACE_ROOT / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow /docs, /redoc, /openapi.json, and /api to bypass
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "documentation": "/docs",
            "api_root": "/api",
        }
