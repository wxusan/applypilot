"""
Telegram Bot service.
Staff link their account by sending /start to the bot.
Provides approval buttons for agent jobs.
"""

import logging
from typing import Optional, List

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

from core.config import settings
from core.db import get_service_client

logger = logging.getLogger(__name__)

_application: Optional[Application] = None


async def start_telegram_bot() -> None:
    """Initialize and start the Telegram bot."""
    global _application

    try:
        _application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()

        _application.add_handler(CommandHandler("start", _handle_start))
        _application.add_handler(CommandHandler("status", _handle_status))
        _application.add_handler(CommandHandler("deadlines", _handle_deadlines))
        _application.add_handler(CommandHandler("approvals", _handle_approvals))
        _application.add_handler(CommandHandler("report", _handle_report))
        _application.add_handler(CommandHandler("help", _handle_help))
        _application.add_handler(CallbackQueryHandler(_handle_callback))

        await _application.initialize()
        await _application.start()
        await _application.updater.start_polling(drop_pending_updates=True)

        logger.info("Telegram bot started")
    except Exception as e:
        logger.error(f"Telegram bot failed to start: {e}")


async def send_message_to_agency_staff(agency_id: str, text: str) -> None:
    """Send a message to all staff members of an agency who have linked Telegram."""
    if not _application:
        logger.warning("Telegram bot not initialized")
        return

    db = get_service_client()
    members = db.table("agency_members").select(
        "user:users(telegram_chat_id)"
    ).eq("agency_id", agency_id).eq("is_active", True).execute()

    for member in members.data or []:
        user = member.get("user") or {}
        if isinstance(user, list):
            user = user[0] if user else {}
        chat_id = user.get("telegram_chat_id")
        if chat_id:
            try:
                await _application.bot.send_message(
                    chat_id=chat_id,
                    text=text,
                    parse_mode="Markdown",
                )
            except Exception as e:
                logger.error(f"Failed to send Telegram message to {chat_id}: {e}")


async def send_alert_to_staff(agency_id: str, message: str) -> None:
    await send_message_to_agency_staff(agency_id=agency_id, text=message)


async def notify_new_student(agency_id: str, student_name: str, added_by: str = "") -> None:
    """Notify agency admin when a new student is added."""
    by_text = f" by {added_by}" if added_by else ""
    await send_message_to_agency_staff(
        agency_id=agency_id,
        text=f"🎓 *New Student Added*\n━━━━━━━━━━━━━━━\n*{student_name}* has been added to your pipeline{by_text}.",
    )


async def send_approval_request(
    agency_id: str,
    job_id: str,
    message: str,
    screenshot_urls: List[str],
) -> None:
    """Send an approval request with inline keyboard buttons."""
    if not _application:
        logger.warning("Telegram bot not initialized")
        return

    db = get_service_client()
    members = db.table("agency_members").select(
        "user:users(telegram_chat_id)"
    ).eq("agency_id", agency_id).eq("is_active", True).execute()

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Approve", callback_data=f"approve:{job_id}"),
            InlineKeyboardButton("❌ Reject", callback_data=f"reject:{job_id}"),
        ]
    ])

    full_message = f"🤖 *Agent Action Required*\n━━━━━━━━━━━━━━━\n{message}"

    for member in members.data or []:
        user = member.get("user") or {}
        if isinstance(user, list):
            user = user[0] if user else {}
        chat_id = user.get("telegram_chat_id")
        if chat_id:
            try:
                await _application.bot.send_message(
                    chat_id=chat_id,
                    text=full_message,
                    parse_mode="Markdown",
                    reply_markup=keyboard,
                )

                # Send screenshot links if any
                for i, url in enumerate(screenshot_urls[:3]):
                    if url:
                        await _application.bot.send_message(
                            chat_id=chat_id,
                            text=f"📸 [Screenshot {i+1}]({url})",
                            parse_mode="Markdown",
                        )
            except Exception as e:
                logger.error(f"Failed to send approval request to {chat_id}: {e}")


# ============================================================
# Handlers
# ============================================================

async def _handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Link Telegram account to ApplyPilot user."""
    chat_id = str(update.effective_chat.id)
    user = update.effective_user

    db = get_service_client()

    # Try to find user by Telegram username or prompt them to link via settings
    await update.message.reply_text(
        f"👋 Welcome to ApplyPilot Bot!\n\n"
        f"Your Telegram Chat ID is: `{chat_id}`\n\n"
        f"Copy this ID and paste it in ApplyPilot → Settings → Telegram Chat ID to link your account.",
        parse_mode="Markdown",
    )


async def _handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Get status of a specific student."""
    chat_id = str(update.effective_chat.id)
    db = get_service_client()

    user = db.table("users").select("id").eq("telegram_chat_id", chat_id).single().execute()
    if not user.data:
        await update.message.reply_text("Link your account first: go to Settings in ApplyPilot.")
        return

    args = context.args
    if not args:
        await update.message.reply_text("Usage: /status <student name>")
        return

    name = " ".join(args)
    member = db.table("agency_members").select("agency_id").eq(
        "user_id", user.data["id"]
    ).single().execute()

    if not member.data:
        return

    students = db.table("students").select("full_name, status, season").ilike(
        "full_name", f"%{name}%"
    ).eq("agency_id", member.data["agency_id"]).execute()

    if not students.data:
        await update.message.reply_text(f"No student found matching '{name}'")
        return

    lines = ["📊 *Student Status:*"]
    for s in students.data[:3]:
        lines.append(f"• {s['full_name']}: {s['status'].upper()} ({s.get('season', 'N/A')})")

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def _handle_deadlines(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    db = get_service_client()

    user = db.table("users").select("id").eq("telegram_chat_id", chat_id).single().execute()
    if not user.data:
        await update.message.reply_text("Link your account first.")
        return

    member = db.table("agency_members").select("agency_id").eq(
        "user_id", user.data["id"]
    ).single().execute()
    if not member.data:
        return

    from datetime import date, timedelta
    in_14 = (date.today() + timedelta(days=14)).isoformat()
    deadlines = db.table("deadlines").select(
        "title, due_date, student:students(full_name)"
    ).eq("agency_id", member.data["agency_id"]).eq("is_complete", False).lte(
        "due_date", in_14
    ).order("due_date").execute()

    if not deadlines.data:
        await update.message.reply_text("No deadlines in the next 14 days 🎉")
        return

    lines = ["📅 *Upcoming Deadlines (14 days):*"]
    for d in deadlines.data[:10]:
        s = d.get("student") or {}
        name = s[0]["full_name"] if isinstance(s, list) else s.get("full_name", "?")
        lines.append(f"• {name}: {d['title']} — {d['due_date']}")

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def _handle_approvals(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    db = get_service_client()

    user = db.table("users").select("id").eq("telegram_chat_id", chat_id).single().execute()
    if not user.data:
        await update.message.reply_text("Link your account first.")
        return

    member = db.table("agency_members").select("agency_id").eq(
        "user_id", user.data["id"]
    ).single().execute()
    if not member.data:
        return

    jobs = db.table("agent_jobs").select("agent_type, job_type, approval_message").eq(
        "agency_id", member.data["agency_id"]
    ).eq("status", "awaiting_approval").execute()

    if not jobs.data:
        await update.message.reply_text("No pending approvals ✅")
        return

    lines = [f"⏳ *{len(jobs.data)} pending approval(s):*"]
    for j in jobs.data[:5]:
        lines.append(f"• {j['agent_type']}: {j['job_type'].replace('_', ' ')}")

    lines.append("\nOpen ApplyPilot to review and approve.")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def _handle_report(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate a brief daily summary report."""
    chat_id = str(update.effective_chat.id)
    db = get_service_client()

    user = db.table("users").select("id").eq("telegram_chat_id", chat_id).single().execute()
    if not user.data:
        await update.message.reply_text("Link your account first: go to Settings in ApplyPilot.")
        return

    member = db.table("agency_members").select("agency_id").eq(
        "user_id", user.data["id"]
    ).single().execute()
    if not member.data:
        return

    agency_id = member.data["agency_id"]

    from datetime import date, timedelta
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    # Student counts by status
    students = db.table("students").select("status").eq("agency_id", agency_id).execute()
    status_counts: dict = {}
    for s in students.data or []:
        key = s["status"]
        status_counts[key] = status_counts.get(key, 0) + 1

    # Pending approvals
    pending = db.table("agent_jobs").select("id", count="exact").eq(
        "agency_id", agency_id
    ).eq("status", "awaiting_approval").execute()
    pending_count = pending.count or 0

    # Upcoming deadlines (next 7 days)
    in_7 = (date.today() + timedelta(days=7)).isoformat()
    deadlines = db.table("deadlines").select("id", count="exact").eq(
        "agency_id", agency_id
    ).eq("is_complete", False).lte("due_date", in_7).execute()
    deadline_count = deadlines.count or 0

    # Agent jobs completed today
    completed_today = db.table("agent_jobs").select("id", count="exact").eq(
        "agency_id", agency_id
    ).eq("status", "completed").gte("completed_at", today).execute()
    completed_count = completed_today.count or 0

    total = sum(status_counts.values())

    lines = [
        f"📊 *Daily Report — {today}*",
        "━━━━━━━━━━━━━━━",
        f"👥 Total Students: *{total}*",
    ]

    if status_counts:
        lines.append("\n*Pipeline Breakdown:*")
        for status, count in sorted(status_counts.items()):
            lines.append(f"  • {status.capitalize()}: {count}")

    lines.extend([
        f"\n⏳ Pending Approvals: *{pending_count}*",
        f"📅 Deadlines (next 7 days): *{deadline_count}*",
        f"✅ Agent Jobs Completed Today: *{completed_count}*",
    ])

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def _handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "📖 *ApplyPilot Bot Commands:*\n\n"
        "/start — Link your Telegram account\n"
        "/status <name> — Check student status\n"
        "/deadlines — View upcoming deadlines\n"
        "/approvals — View pending approvals\n"
        "/report — Daily summary report\n"
        "/help — Show this message",
        parse_mode="Markdown",
    )


async def _handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle inline keyboard button presses for approvals."""
    query = update.callback_query
    await query.answer()

    data = query.data or ""
    chat_id = str(query.from_user.id)

    db = get_service_client()

    # Verify user is linked
    user = db.table("users").select("id").eq("telegram_chat_id", chat_id).single().execute()
    if not user.data:
        await query.edit_message_text("Please link your account first (Settings → Telegram Chat ID).")
        return

    member = db.table("agency_members").select("agency_id").eq(
        "user_id", user.data["id"]
    ).single().execute()
    if not member.data:
        await query.edit_message_text("Account not associated with any agency.")
        return

    agency_id = member.data["agency_id"]

    if data.startswith("approve:"):
        job_id = data.split(":", 1)[1]
        job = db.table("agent_jobs").select("id, agent_type, status").eq(
            "id", job_id
        ).eq("agency_id", agency_id).single().execute()

        if not job.data:
            await query.edit_message_text("Job not found or not authorized.")
            return

        if job.data["status"] != "awaiting_approval":
            await query.edit_message_text(
                query.message.text + f"\n\n⚠️ Job already {job.data['status']}.",
                parse_mode="Markdown",
            )
            return

        from datetime import datetime, timezone
        db.table("agent_jobs").update({
            "status": "approved",
            "approved_by": user.data["id"],
            "approved_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", job_id).execute()

        # Write audit log
        from core.audit import write_audit_log
        import asyncio
        asyncio.create_task(write_audit_log(
            agency_id=agency_id,
            user_id=user.data["id"],
            action="agent_job.approved",
            entity_type="agent_job",
            entity_id=job_id,
            new_value={"source": "telegram"},
        ))

        # Resume agent-specific post-approval actions
        if job.data["agent_type"] == "browser":
            asyncio.create_task(_resume_browser_agent_bg(job_id))
        elif job.data["agent_type"] == "writer":
            asyncio.create_task(_approve_writer_content_bg(job_id))
        elif job.data["agent_type"] == "email":
            output = job.data.get("output_data") or {}
            email_id = output.get("email_id") if isinstance(output, dict) else None
            if email_id:
                asyncio.create_task(_send_email_reply_bg(email_id, job_id))

        await query.edit_message_text(
            query.message.text + "\n\n✅ *Approved via Telegram*",
            parse_mode="Markdown",
        )

    elif data.startswith("reject:"):
        job_id = data.split(":", 1)[1]

        job = db.table("agent_jobs").select("id, agent_type, status, output_data").eq(
            "id", job_id
        ).eq("agency_id", agency_id).single().execute()

        if not job.data:
            await query.edit_message_text("Job not found or not authorized.")
            return

        if job.data["status"] != "awaiting_approval":
            await query.edit_message_text(
                query.message.text + f"\n\n⚠️ Job already {job.data['status']}.",
                parse_mode="Markdown",
            )
            return

        db.table("agent_jobs").update({
            "status": "rejected",
            "rejected_reason": "Rejected via Telegram",
        }).eq("id", job_id).eq("agency_id", agency_id).execute()

        from core.audit import write_audit_log
        import asyncio
        asyncio.create_task(write_audit_log(
            agency_id=agency_id,
            user_id=user.data["id"],
            action="agent_job.rejected",
            entity_type="agent_job",
            entity_id=job_id,
            new_value={"reason": "Rejected via Telegram", "source": "telegram"},
        ))

        # Agent-specific rejection callbacks
        if job.data["agent_type"] == "writer":
            asyncio.create_task(
                _reject_writer_content_bg(job_id, "Rejected via Telegram")
            )

        await query.edit_message_text(
            query.message.text + "\n\n❌ *Rejected via Telegram*",
            parse_mode="Markdown",
        )


async def _resume_browser_agent_bg(job_id: str) -> None:
    """Background task to resume browser agent after approval."""
    try:
        from agents.browser import BrowserAgent
        agent = BrowserAgent()
        await agent.resume_after_approval(job_id)
    except Exception as e:
        logger.error(f"Browser agent resume failed (Telegram approve) for job {job_id}: {e}")


async def _approve_writer_content_bg(job_id: str) -> None:
    """Background task: update essay/rec_letter/email status to approved after Telegram approval."""
    try:
        from agents.writer import WriterAgent
        agent = WriterAgent()
        await agent.approve_content(job_id)
    except Exception as exc:
        logger.error(f"Writer approve_content failed for job {job_id}: {exc}")


async def _reject_writer_content_bg(job_id: str, reason: str) -> None:
    """Background task: update essay/rec_letter/email status to rejected after Telegram rejection."""
    try:
        from agents.writer import WriterAgent
        agent = WriterAgent()
        await agent.reject_content(job_id, reason)
    except Exception as exc:
        logger.error(f"Writer reject_content failed for job {job_id}: {exc}")


async def _send_email_reply_bg(email_id: str, job_id: str) -> None:
    """Background task: send approved email reply via SMTP."""
    try:
        from agents.email_agent import EmailAgent
        agent = EmailAgent()
        await agent.send_reply_via_smtp(email_id, job_id)
    except Exception as exc:
        logger.error(f"EmailAgent SMTP send failed for email {email_id} / job {job_id}: {exc}")
