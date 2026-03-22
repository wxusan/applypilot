import logging
import asyncio
import time
from contextlib import asynccontextmanager
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

_START_TIME = time.time()

from core.config import settings
from api import students, applications, documents, emails, essays, deadlines, admin, agent_jobs, settings as settings_api, audit, browser_agent, staff, super_admin, billing
from services.telegram_bot import start_telegram_bot
from services.scheduler import start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Sentry (optional)
if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


async def _resume_stale_browser_jobs() -> None:
    """On startup, resume any browser jobs that were left awaiting_approval."""
    await asyncio.sleep(3)  # let DB connections settle
    try:
        from core.db import get_service_client
        from agents.browser import BrowserAgent

        db = get_service_client()
        stale = (
            db.table("agent_jobs")
            .select("id")
            .eq("agent_type", "browser")
            .eq("status", "awaiting_approval")
            .execute()
        )
        for job in stale.data or []:
            try:
                await BrowserAgent().resume_after_approval(job["id"])
                logger.info(f"Startup: resumed browser job {job['id']}")
            except Exception as exc:
                logger.warning(f"Startup: could not resume browser job {job['id']}: {exc}")
    except Exception as exc:
        logger.warning(f"Startup browser-resume scan failed: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background services on server boot, clean up on shutdown."""
    await start_scheduler()
    asyncio.create_task(start_telegram_bot())
    asyncio.create_task(_resume_stale_browser_jobs())
    yield
    # Shutdown: nothing to clean up currently


app = FastAPI(
    title="ApplyPilot API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Routers
app.include_router(students.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(emails.router, prefix="/api")
app.include_router(essays.router, prefix="/api")
app.include_router(deadlines.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(agent_jobs.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(browser_agent.router, prefix="/api")
app.include_router(staff.router, prefix="/api")
app.include_router(super_admin.router, prefix="/api")
app.include_router(billing.router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.method} {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred.",
        },
    )


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000)
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)"
    )
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    response.headers["X-RateLimit-Limit"] = "100"
    response.headers["X-RateLimit-Window"] = "60s"
    return response


@app.get("/health")
async def health():
    uptime_seconds = round(time.time() - _START_TIME)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime_str = f"{hours}h {minutes}m {seconds}s"
    return {
        "status": "ok",
        "version": "1.0.0",
        "uptime": uptime_str,
        "uptime_seconds": uptime_seconds,
    }
