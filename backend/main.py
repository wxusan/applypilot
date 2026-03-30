import logging
import asyncio
from contextlib import asynccontextmanager
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from core.config import settings
from api import students, applications, documents, emails, essays, deadlines, admin, agent_jobs, settings as settings_api, audit, browser_agent, staff, super_admin, billing, reports, chat, recommendation_letters, notifications, college_fit, colleges, credentials, workflows, workflow_steps, email_monitor, payments, portals
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
