"""
Coordinator Agent — sends morning and evening briefings to all agency staff.
Morning: 8 AM cron (Asia/Tashkent).  Evening: 9 PM cron (Asia/Tashkent).
"""

import logging
from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo

from core.db import get_service_client
from core.config import settings
from services.telegram_bot import send_message_to_agency_staff

_TZ = ZoneInfo("Asia/Tashkent")

logger = logging.getLogger(__name__)

_DASHBOARD_URL = settings.DASHBOARD_URL  # e.g. https://app.applypilot.co


class CoordinatorAgent:

    # ------------------------------------------------------------------ #
    #  Morning briefing — 8 AM                                            #
    # ------------------------------------------------------------------ #

    async def send_morning_briefing(self, agency_id: str) -> None:
        """
        Exact format:
          🌅 Good morning
          ━━━━━━━━━━━━━━━
          📅 Deadlines this week: N
          ⏳ Pending approvals: N
          📧 New emails: N
          🤖 Agent jobs overnight: N
          [View Dashboard](url)
        """
        db = get_service_client()

        today = date.today()
        in_7_days = (today + timedelta(days=7)).isoformat()

        # Deadlines due within 7 days (not complete)
        deadlines_res = db.table("deadlines").select("id").eq(
            "agency_id", agency_id
        ).eq("is_complete", False).gte(
            "due_date", today.isoformat()
        ).lte("due_date", in_7_days).execute()

        deadlines_count = len(deadlines_res.data or [])

        # Pending approvals
        approvals_res = db.table("agent_jobs").select("id").eq(
            "agency_id", agency_id
        ).eq("status", "awaiting_approval").execute()

        approvals_count = len(approvals_res.data or [])

        # New emails in last 24 hours
        since_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        emails_res = db.table("emails").select("id").eq(
            "agency_id", agency_id
        ).eq("direction", "inbound").gte("received_at", since_24h).execute()

        emails_count = len(emails_res.data or [])

        # Agent jobs run overnight (last 12 hours, any terminal status)
        since_12h = (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()
        overnight_res = db.table("agent_jobs").select("id").eq(
            "agency_id", agency_id
        ).gte("created_at", since_12h).execute()

        overnight_count = len(overnight_res.data or [])

        message = (
            f"🌅 Good morning\n"
            f"━━━━━━━━━━━━━━━\n"
            f"📅 Deadlines this week: {deadlines_count}\n"
            f"⏳ Pending approvals: {approvals_count}\n"
            f"📧 New emails: {emails_count}\n"
            f"🤖 Agent jobs overnight: {overnight_count}\n"
            f"[View Dashboard]({_DASHBOARD_URL})"
        )

        await send_message_to_agency_staff(agency_id=agency_id, text=message)
        logger.info(f"CoordinatorAgent: morning briefing sent for agency {agency_id}")

    # ------------------------------------------------------------------ #
    #  Evening summary — 9 PM                                             #
    # ------------------------------------------------------------------ #

    async def send_evening_summary(self, agency_id: str) -> None:
        """
        Exact format:
          🌙 Evening Summary
          ━━━━━━━━━━━━━━━
          ✅ Completed today: N
          ⏳ Pending approvals: N
          📅 Due tomorrow: N
          [View Dashboard](url)
        """
        db = get_service_client()

        # Agent jobs completed / approved today (since midnight Tashkent time)
        now_local = datetime.now(_TZ)
        midnight = now_local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(ZoneInfo("UTC"))
        completed_res = db.table("agent_jobs").select("id").eq(
            "agency_id", agency_id
        ).in_("status", ["completed", "approved"]).gte(
            "updated_at", midnight.isoformat()
        ).execute()

        completed_count = len(completed_res.data or [])

        # Still awaiting approval right now
        pending_res = db.table("agent_jobs").select("id").eq(
            "agency_id", agency_id
        ).eq("status", "awaiting_approval").execute()

        pending_count = len(pending_res.data or [])

        # Deadlines due tomorrow
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        tomorrow_dl = db.table("deadlines").select("id").eq(
            "agency_id", agency_id
        ).eq("is_complete", False).eq("due_date", tomorrow).execute()

        tomorrow_count = len(tomorrow_dl.data or [])

        message = (
            f"🌙 Evening Summary\n"
            f"━━━━━━━━━━━━━━━\n"
            f"✅ Completed today: {completed_count}\n"
            f"⏳ Pending approvals: {pending_count}\n"
            f"📅 Due tomorrow: {tomorrow_count}\n"
            f"[View Dashboard]({_DASHBOARD_URL})"
        )

        await send_message_to_agency_staff(agency_id=agency_id, text=message)
        logger.info(f"CoordinatorAgent: evening summary sent for agency {agency_id}")

    # ------------------------------------------------------------------ #
    #  Run for all active agencies (called by APScheduler)                #
    # ------------------------------------------------------------------ #

    async def run_for_all_agencies(self, briefing_type: str) -> None:
        """
        Iterates every active agency and sends the requested briefing.
        briefing_type ∈ {'morning', 'evening'}
        """
        db = get_service_client()

        agencies = db.table("agencies").select("id").eq(
            "subscription_status", "active"
        ).execute()

        for agency in agencies.data or []:
            try:
                if briefing_type == "morning":
                    await self.send_morning_briefing(agency["id"])
                elif briefing_type == "evening":
                    await self.send_evening_summary(agency["id"])
            except Exception as exc:
                logger.error(
                    f"CoordinatorAgent: {briefing_type} briefing failed "
                    f"for agency {agency['id']}: {exc}"
                )
