from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.audit import audit_middleware
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.schemas.common import ResponseEnvelope

LEGACY_WEB_DIR = Path(__file__).resolve().parent / "web" / "admin"
ADMIN_DIST_DIR = Path(__file__).resolve().parent.parent / "admin-web" / "dist"


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        version="0.1.0",
    )

    register_exception_handlers(app)
    app.middleware("http")(audit_middleware)
    app.include_router(api_router, prefix="/api")

    if ADMIN_DIST_DIR.exists():
        app.mount("/admin/assets", StaticFiles(directory=ADMIN_DIST_DIR / "assets"), name="admin-assets")
    app.mount("/admin/static", StaticFiles(directory=LEGACY_WEB_DIR), name="admin-static")
    app.mount("/merchant-admin/static", StaticFiles(directory=LEGACY_WEB_DIR), name="merchant-admin-static")

    @app.get("/admin", include_in_schema=False)
    @app.get("/admin/", include_in_schema=False)
    async def admin_console() -> FileResponse:
        if (ADMIN_DIST_DIR / "index.html").exists():
            return FileResponse(ADMIN_DIST_DIR / "index.html")
        return FileResponse(LEGACY_WEB_DIR / "index.html")

    @app.get("/merchant-admin", include_in_schema=False)
    @app.get("/merchant-admin/", include_in_schema=False)
    async def merchant_admin_console() -> FileResponse:
        return FileResponse(LEGACY_WEB_DIR / "index.html")

    @app.get("/health", response_model=ResponseEnvelope[dict[str, str]], tags=["health"])
    async def healthcheck() -> ResponseEnvelope[dict[str, str]]:
        return ResponseEnvelope.success({"status": "ok", "env": settings.app_env})

    return app


app = create_app()
