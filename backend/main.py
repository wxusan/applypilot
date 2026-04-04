import logging
import asyncio
from contextlib import asynccontextmanager
import sentry_sdk
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter

from core.config import settings
from api import students, applications, documents, emails, essays, deadlines, admin, agent_jobs, settings as settings_api, audit, browser_agent, staff, super_admin, billing, reports, chat, recommendation_letters, notifications, college_fit, colleges, credentials, workflows, workflow_steps, email_monitor, payments, portals
from services.telegram_bot import start_telegram_bot, get_bot_status
from services.scheduler import start_scheduler
from services.step_dispatcher import get_dispatcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Sentry (optional)
if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)

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

    # Start the step dispatcher — picks up queued workflow steps and runs agents
    dispatcher = get_dispatcher()
    dispatcher_task = asyncio.create_task(dispatcher.start())
    logger.info("Step dispatcher background task launched")

    yield

    # Shutdown: stop the dispatcher gracefully
    dispatcher.stop()
    dispatcher_task.cancel()


app = FastAPI(
    title="ApplyPilot API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

# CORS — guard against wildcard in production
_cors_origins = settings.CORS_ORIGINS
if "*" in _cors_origins and not settings.DEBUG:
    logger.warning(
        "CORS_ORIGINS contains '*' in production mode. "
        "This allows any website to make authenticated API calls. "
        "Set CORS_ORIGINS to your actual frontend domain in .env."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
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
app.include_router(reports.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(recommendation_letters.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(college_fit.router, prefix="/api")
app.include_router(colleges.router, prefix="/api")
app.include_router(credentials.router, prefix="/api")
app.include_router(workflows.router, prefix="/api")
app.include_router(workflow_steps.router, prefix="/api")
app.include_router(email_monitor.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(portals.router, prefix="/api")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Standardise all HTTPException responses to {"error": ..., "detail": ...}."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


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


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/health/telegram")
async def telegram_health():
    """Check Telegram bot connection status."""
    status = get_bot_status()
    return JSONResponse(
        status_code=200 if status["connected"] else 503,
        content=status,
    )
