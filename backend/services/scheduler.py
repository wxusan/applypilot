"""
APScheduler — runs cron jobs for all agents.
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler = None

# Maps job_id → the async function to call when manually triggered
_JOB_FUNCS: dict = {}


def get_scheduler() -> AsyncIOScheduler:
    """Return the running scheduler instance (or None if not started)."""
    return _scheduler


def get_job_func(job_id: str):
    """Return the async function for a given job_id, or None."""
    return _JOB_FUNCS.get(job_id)


async def start_scheduler() -> None:
    global _scheduler

    _scheduler = AsyncIOScheduler()

    # Morning briefing — 8AM Asia/Tashkent
    _scheduler.add_job(
        _run_morning_briefing,
        CronTrigger(hour=8, minute=0, timezone="Asia/Tashkent"),
        id="morning_briefing",
        replace_existing=True,
    )

    # Evening summary — 9PM Asia/Tashkent
    _scheduler.add_job(
        _run_evening_summary,
        CronTrigger(hour=21, minute=0, timezone="Asia/Tashkent"),
        id="evening_summary",
        replace_existing=True,
    )

    # Deadline tracker — 7AM Asia/Tashkent
    _scheduler.add_job(
        _run_deadline_tracker,
        CronTrigger(hour=7, minute=0, timezone="Asia/Tashkent"),
        id="deadline_tracker_morning",
        replace_existing=True,
    )

    # Emergency deadline alerts — 12PM
    _scheduler.add_job(
        _run_emergency_deadline_alerts,
        CronTrigger(hour=12, minute=0, timezone="Asia/Tashkent"),
        id="deadline_tracker_noon",
        replace_existing=True,
    )

    # Emergency deadline alerts — 6PM
    _scheduler.add_job(
        _run_emergency_deadline_alerts,
        CronTrigger(hour=18, minute=0, timezone="Asia/Tashkent"),
        id="deadline_tracker_evening",
        replace_existing=True,
    )

    # Email sync — every hour
    _scheduler.add_job(
        _run_email_sync,
        CronTrigger(minute=0),  # Top of every hour
        id="email_sync",
        replace_existing=True,
    )

    # Register all job functions for manual triggering
    _JOB_FUNCS["morning_briefing"] = _run_morning_briefing
    _JOB_FUNCS["evening_summary"] = _run_evening_summary
    _JOB_FUNCS["deadline_tracker_morning"] = _run_deadline_tracker
    _JOB_FUNCS["deadline_tracker_noon"] = _run_emergency_deadline_alerts
    _JOB_FUNCS["deadline_tracker_evening"] = _run_emergency_deadline_alerts
    _JOB_FUNCS["email_sync"] = _run_email_sync

    _scheduler.start()
    logger.info("Scheduler started with all cron jobs")


async def _run_morning_briefing():
    try:
        from agents.coordinator import CoordinatorAgent
        agent = CoordinatorAgent()
        await agent.run_for_all_agencies("morning")
    except Exception as e:
        logger.error(f"Morning briefing cron failed: {e}")


async def _run_evening_summary():
    try:
        from agents.coordinator import CoordinatorAgent
        agent = CoordinatorAgent()
        await agent.run_for_all_agencies("evening")
    except Exception as e:
        logger.error(f"Evening summary cron failed: {e}")


async def _run_deadline_tracker():
    try:
        from agents.deadline_tracker import DeadlineTrackerAgent
        agent = DeadlineTrackerAgent()
        await agent.run()
    except Exception as e:
        logger.error(f"Deadline tracker cron failed: {e}")


async def _run_emergency_deadline_alerts():
    try:
        from agents.deadline_tracker import DeadlineTrackerAgent
        agent = DeadlineTrackerAgent()
        await agent.run_emergency_alerts()
    except Exception as e:
        logger.error(f"Emergency deadline alerts failed: {e}")


async def _run_email_sync():
    try:
        from agents.email_agent import EmailAgent
        agent = EmailAgent()
        await agent.sync_all_accounts()
    except Exception as e:
        logger.error(f"Email sync cron failed: {e}")
