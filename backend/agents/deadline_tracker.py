"""
Deadline Tracker Agent — never lets a deadline slip.
7AM daily: alerts at 30, 14, 7, 3, 1 days before each deadline.
Emergency alerts day-of at 7AM, 12PM, 6PM for incomplete deadlines.
"""

import logging
from datetime import date, timedelta, datetime
from typing import List

from core.config import settings
from core.db import get_service_client
from services.telegram_bot import send_alert_to_staff

logger = logging.getLogger(__name__)

DASHBOARD_BASE_URL = getattr(settings, "DASHBOARD_URL", "https://app.applypilot.co")


class DeadlineTrackerAgent:

    async def run(self) -> None:
        """Main entry — called by cron at 7AM."""
        db = get_service_client()

        agencies = db.table("agencies").select("id, name, timezone").eq(
            "subscription_status", "active"
        ).execute()

        for agency in agencies.data or []:
            try:
                await self._process_agency_deadlines(agency["id"])
            except Exception as e:
                logger.error(f"Deadline tracker failed for agency {agency['id']}: {e}")

    async def _process_agency_deadlines(self, agency_id: str) -> None:
        db = get_service_client()
        today = date.today()

        # Fetch all upcoming incomplete deadlines with student and application info
        result = db.table("deadlines").select(
            "id, title, type, due_date, alert_days_before, alerts_sent, "
            "student_id, application_id, "
            "student:students(id, full_name, status), "
            "application:applications(university_name, status)"
        ).eq("agency_id", agency_id).eq("is_complete", False).gte(
            "due_date", today.isoformat()
        ).execute()

        for deadline in result.data or []:
            due = date.fromisoformat(deadline["due_date"])
            days_left = (due - today).days
            alert_days: List[int] = deadline.get("alert_days_before") or [30, 14, 7, 3, 1]
            alerts_sent: List[int] = deadline.get("alerts_sent") or []

            if days_left in alert_days and days_left not in alerts_sent:
                student = deadline.get("student") or {}
                if isinstance(student, list):
                    student = student[0] if student else {}
                application = deadline.get("application") or {}
                if isinstance(application, list):
                    application = application[0] if application else {}

                student_name = student.get("full_name", "Unknown")
                app_status = student.get("status", "—")
                university = application.get("university_name")

                student_id = deadline.get("student_id") or (student.get("id") if isinstance(student, dict) else None)
                dashboard_link = f"{DASHBOARD_BASE_URL}/students/{student_id}/deadlines" if student_id else DASHBOARD_BASE_URL

                days_str = f"{days_left} day{'s' if days_left != 1 else ''}"
                message = self._format_alert_message(
                    student_name=student_name,
                    university=university or deadline["title"],
                    deadline_title=deadline["title"],
                    due_date=deadline["due_date"],
                    days_left=days_left,
                    days_str=days_str,
                    app_status=app_status,
                    dashboard_link=dashboard_link,
                )

                await send_alert_to_staff(agency_id=agency_id, message=message)

                # Record that this N-days alert was sent
                new_sent = alerts_sent + [days_left]
                db.table("deadlines").update({"alerts_sent": new_sent}).eq(
                    "id", deadline["id"]
                ).execute()

                logger.info(
                    f"Deadline alert sent: {student_name} — {deadline['title']} — {days_left}d left"
                )

    @staticmethod
    def _format_alert_message(
        *,
        student_name: str,
        university: str,
        deadline_title: str,
        due_date: str,
        days_left: int,
        days_str: str,
        app_status: str,
        dashboard_link: str,
        is_emergency: bool = False,
    ) -> str:
        if is_emergency:
            prefix = "🚨 *TODAY'S DEADLINE — ACTION REQUIRED*"
        elif days_left <= 3:
            prefix = "🚨 *URGENT Deadline Alert*"
        elif days_left <= 7:
            prefix = "⚠️ *Deadline Alert*"
        else:
            prefix = "⚠️ Deadline Alert"

        lines = [
            prefix,
            "━━━━━━━━━━━━━━━",
            f"Student: {student_name}",
            f"University: {university}",
            f"Deadline: {due_date} ({days_str})" if not is_emergency else f"Deadline: {due_date} — *TODAY*",
            f"Status: {app_status}",
            f"[View in Dashboard]({dashboard_link})",
        ]
        return "\n".join(lines)

    async def run_emergency_alerts(self) -> None:
        """Called at 7AM, 12PM, 6PM for day-of incomplete deadlines."""
        db = get_service_client()
        today = date.today().isoformat()

        agencies = db.table("agencies").select("id").eq(
            "subscription_status", "active"
        ).execute()

        for agency in agencies.data or []:
            try:
                result = db.table("deadlines").select(
                    "id, title, student_id, application_id, "
                    "student:students(id, full_name, status), "
                    "application:applications(university_name)"
                ).eq("agency_id", agency["id"]).eq("is_complete", False).eq(
                    "due_date", today
                ).execute()

                for deadline in result.data or []:
                    student = deadline.get("student") or {}
                    if isinstance(student, list):
                        student = student[0] if student else {}
                    application = deadline.get("application") or {}
                    if isinstance(application, list):
                        application = application[0] if application else {}

                    student_name = student.get("full_name", "Unknown")
                    app_status = student.get("status", "—")
                    university = application.get("university_name")
                    student_id = deadline.get("student_id") or student.get("id")
                    dashboard_link = (
                        f"{DASHBOARD_BASE_URL}/students/{student_id}/deadlines"
                        if student_id else DASHBOARD_BASE_URL
                    )

                    message = DeadlineTrackerAgent._format_alert_message(
                        student_name=student_name,
                        university=university or deadline["title"],
                        deadline_title=deadline["title"],
                        due_date=today,
                        days_left=0,
                        days_str="today",
                        app_status=app_status,
                        dashboard_link=dashboard_link,
                        is_emergency=True,
                    )

                    await send_alert_to_staff(agency_id=agency["id"], message=message)
                    logger.info(f"Emergency deadline alert: {student_name} — {deadline['title']}")

            except Exception as e:
                logger.error(f"Emergency alerts failed for agency {agency['id']}: {e}")
