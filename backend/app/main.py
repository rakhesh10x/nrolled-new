"""
FastAPI Application Entry Point.

Configures the FastAPI app with:
    - Production-ready API versioning (/api/v1/)
    - Request ID Middleware (X-Request-ID header & logging context)
    - Pydantic-settings environment validation
    - Health and version status endpoints
    - CORS middleware
    - Global exception handling
"""

from contextlib import asynccontextmanager
import time
from typing import AsyncGenerator
import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.logging_config import logger


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown logic
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manage application startup and shutdown events.

    Startup:
        - Validate environment variables (Pydantic Settings)
        - Initialize logging
        - Create database tables & seed initial demo data
        - Load HR Knowledge Base (Phase 5+)

    Shutdown:
        - Clean up active connections
    """
    settings = get_settings()
    logger.info(
        f"[STARTUP] HR Assistant API v1.0.0 starting up... [Model: {settings.LLM_MODEL} | Base: {settings.LLM_BASE_URL}]",
        extra={"request_id": "startup"},
    )

    # Initialize tables and seed database
    try:
        from app.database import SessionLocal, init_db
        from app.seed import seed_database

        init_db()
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    except Exception as err:
        logger.error(f"Error during DB startup/seeding: {err}", extra={"request_id": "startup"})

    yield
    logger.info("[SHUTDOWN] HR Assistant API shutting down...", extra={"request_id": "shutdown"})


# ---------------------------------------------------------------------------
# Application Factory
# ---------------------------------------------------------------------------
settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-ready AI-powered HR Assistant with RAG & SSE Streaming. "
        "APIs are mounted under /api/v1/."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# Middleware: Request ID & Request Logging
# ---------------------------------------------------------------------------
@app.middleware("http")
async def request_id_and_logging_middleware(
    request: Request, call_next
) -> Response:
    """
    Generate or preserve X-Request-ID for every incoming HTTP request.
    Logs request method, path, response status, and processing duration.
    Injects X-Request-ID into response headers.
    """
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    start_time = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    # Inject Request ID into response header
    response.headers["X-Request-ID"] = request_id

    # Log request line
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} "
        f"({duration_ms:.2f}ms)",
        extra={"request_id": request_id},
    )

    return response


# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all exception handler.
    Returns consistent JSON error structure without leaking internal tracebacks.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        f"Unhandled Exception: {str(exc)}",
        exc_info=True,
        extra={"request_id": request_id},
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "An unexpected server error occurred. Please try again later.",
            "code": "INTERNAL_SERVER_ERROR",
            "request_id": request_id,
        },
        headers={"X-Request-ID": request_id},
    )


# ---------------------------------------------------------------------------
# API v1 Health & Version Endpoints
# ---------------------------------------------------------------------------
HEALTH_RESPONSE = {
    "status": "ok",
    "version": settings.APP_VERSION,
    "service": "HR Assistant",
}


@app.get("/api/v1/health", tags=["Health"])
async def get_v1_health() -> dict:
    """Production health-check endpoint under /api/v1/."""
    return HEALTH_RESPONSE


@app.get("/api/v1/version", tags=["Health"])
async def get_v1_version() -> dict:
    """Production version endpoint under /api/v1/."""
    return HEALTH_RESPONSE


# ---------------------------------------------------------------------------
# Register Routers
# ---------------------------------------------------------------------------
from app.routers.admin_router import router as admin_router
from app.routers.auth_router import router as auth_router
from app.routers.chat_router import router as chat_router
from app.routers.employee_router import router as employee_router

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(employee_router)
app.include_router(admin_router)


# Backward compatibility aliases
@app.get("/api/health", tags=["Health"], include_in_schema=False)
async def get_legacy_health() -> dict:
    return HEALTH_RESPONSE


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {
        "message": f"Welcome to {settings.APP_NAME} v{settings.APP_VERSION}",
        "docs": "/docs",
        "health": "/api/v1/health",
        "version": "/api/v1/version",
    }
