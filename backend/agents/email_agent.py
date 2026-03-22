"""
Email Agent — monitors student email accounts via IMAP, categorises emails with
GPT-4o-mini, drafts replies, and sends them via SMTP only after explicit approval.
Runs hourly via APScheduler. Credentials decrypted in memory only, never logged.
"""

import imaplib
import email
import smtplib
import logging
from datetime import datetime, timezone
from email.header import decode_header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from openai import AsyncOpenAI

from core.db import get_service_client
from core.config import settings
from core.encryption import decrypt
from core.audit import write_audit_log
from services.telegram_bot import send_alert_to_staff, send_approval_request
from agents.souls import load_soul

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

CATEGORIES = [
    "university_update",
    "document_request",
    "interview_invite",
    "acceptance",
    "rejection",
    "waitlist",
    "financial_aid",
    "general",
]

URGENT_CATEGORIES = {"acceptance", "rejection", "waitlist", "interview_invite"}

# Categories where we skip drafting a reply
_NO_REPLY_CATEGORIES = {"rejection", "acceptance"}

# SMTP provider map — derived from IMAP host since schema has no smtp_* columns
_SMTP_MAP = {
    "imap.gmail.com":       ("smtp.gmail.com",            587),
    "imap.mail.yahoo.com":  ("smtp.mail.yahoo.com",       587),
    "outlook.office365.com":("smtp.office365.com",         587),
    "imap-mail.outlook.com":("smtp-mail.outlook.com",      587),
    "imap.mail.me.com":     ("smtp.mail.me.com",           587),
    "imap.zoho.com":        ("smtp.zoho.com",              587),
    "imap.fastmail.com":    ("smtp.fastmail.com",          587),
}


def _derive_smtp(imap_host: str) -> tuple[str, int]:
    """Return (smtp_host, smtp_port) based on the known IMAP host."""
    if imap_host in _SMTP_MAP:
        return _SMTP_MAP[imap_host]
    # Best-effort: replace first 'imap' segment with 'smtp'
    smtp_host = imap_host.replace("imap.", "smtp.", 1)
    return smtp_host, 587


class EmailAgent:

    # ------------------------------------------------------------------ #
    #  Hourly sync entry point                                             #
    # ------------------------------------------------------------------ #

    async def sync_all_accounts(self) -> None:
        """Sync every active email account. Called once per hour by APScheduler."""
        db = get_service_client()

        accounts = db.table("email_accounts").select(
            "*, student:students(id, full_name, agency_id)"
        ).eq("is_active", True).execute()

        for account in accounts.data or []:
            try:
                await self._sync_account(account)
            except Exception as exc:
                logger.error(
                    f"EmailAgent: sync failed for account {account['id']}: {exc}"
                )

    # ------------------------------------------------------------------ #
    #  Per-account sync                                                    #
    # ------------------------------------------------------------------ #

    async def _sync_account(self, account: dict) -> None:
        db = get_service_client()

        student = account.get("student") or {}
        if isinstance(student, list):
            student = student[0] if student else {}

        agency_id = student.get("agency_id")
        student_id = account["student_id"]

        if not agency_id:
            logger.error(
                f"EmailAgent: cannot sync account {account['id']} — "
                f"student {student_id} has no agency_id"
            )
            return

        # Decrypt in memory — never logged
        password = decrypt(account["password_encrypted"])

        try:
            mail = imaplib.IMAP4_SSL(account["imap_host"], account["imap_port"])
            mail.login(account["email_address"], password)
            mail.select("inbox")

            _, message_ids = mail.search(None, "UNSEEN")

            for msg_id in message_ids[0].split():
                try:
                    await self._process_message(
                        mail, msg_id, account, student, agency_id, student_id
                    )
                except Exception as exc:
                    logger.error(f"EmailAgent: failed to process message {msg_id}: {exc}")

            mail.logout()

            db.table("email_accounts").update({
                "last_synced_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", account["id"]).execute()

        except Exception as exc:
            logger.error(
                f"EmailAgent: IMAP connection failed for "
                f"{account['email_address']}: {exc}"
            )
        finally:
            password = ""  # Clear from memory immediately

    async def _process_message(
        self,
        mail: imaplib.IMAP4_SSL,
        msg_id: bytes,
        account: dict,
        student: dict,
        agency_id: str,
        student_id: str,
    ) -> None:
        db = get_service_client()

        _, data = mail.fetch(msg_id, "(RFC822)")
        raw = data[0][1]
        msg = email.message_from_bytes(raw)

        subject = self._decode_header(msg["Subject"] or "")
        from_addr = self._decode_header(msg["From"] or "")
        body = self._extract_body(msg)
        message_id_header = msg["Message-ID"] or ""

        # Skip duplicates
        existing = (
            db.table("emails")
            .select("id")
            .eq("message_id", message_id_header)
            .eq("student_id", student_id)
            .execute()
        )
        if existing.data:
            return

        category = await self._categorize_email(subject, body, from_addr)
        importance = "urgent" if category in URGENT_CATEGORIES else "normal"

        # Persist email
        email_insert = db.table("emails").insert({
            "agency_id": agency_id,
            "student_id": student_id,
            "email_account_id": account["id"],
            "direction": "inbound",
            "message_id": message_id_header,
            "from_address": from_addr,
            "to_address": account["email_address"],
            "subject": subject,
            "body_text": body[:10000],
            "received_at": datetime.now(timezone.utc).isoformat(),
            "category": category,
            "importance": importance,
        }).execute()

        if not email_insert.data:
            return

        email_id = email_insert.data[0]["id"]

        await write_audit_log(
            agency_id=agency_id,
            student_id=student_id,
            action="email.received",
            entity_type="email",
            entity_id=email_id,
            new_value={"category": category, "importance": importance},
        )

        # Urgent alert
        if importance == "urgent":
            await send_alert_to_staff(
                agency_id=agency_id,
                message=(
                    f"🚨 *{category.replace('_', ' ').upper()}*\n"
                    f"Student: {student.get('full_name', 'Unknown')}\n"
                    f"From: {from_addr}\n"
                    f"Subject: {subject}"
                ),
            )

        # Draft reply and queue for approval (skip for rejections / acceptances)
        if category not in _NO_REPLY_CATEGORIES:
            await self._create_reply_draft(
                email_id=email_id,
                subject=subject,
                body=body,
                student=student,
                account=account,
                agency_id=agency_id,
                student_id=student_id,
            )

    # ------------------------------------------------------------------ #
    #  Reply draft → agent_job → Telegram approval                        #
    # ------------------------------------------------------------------ #

    async def _create_reply_draft(
        self,
        email_id: str,
        subject: str,
        body: str,
        student: dict,
        account: dict,
        agency_id: str,
        student_id: str,
    ) -> None:
        db = get_service_client()

        draft = await self._draft_reply(subject, body, student)

        # Save draft to email record
        db.table("emails").update({
            "ai_draft": draft,
            "draft_status": "pending_approval",
        }).eq("id", email_id).execute()

        # Create agent_job for approval
        job_res = db.table("agent_jobs").insert({
            "agency_id": agency_id,
            "student_id": student_id,
            "agent_type": "email",
            "job_type": "email_reply",
            "status": "awaiting_approval",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "requires_approval": True,
            "approval_message": (
                f"Reply draft for: {subject}\n\n"
                + draft[:400]
                + ("…" if len(draft) > 400 else "")
            ),
            "output_data": {
                "email_id": email_id,
                "email_account_id": account["id"],
                "to_address": account["email_address"],
                "subject": f"Re: {subject}",
            },
        }).execute()

        if not job_res.data:
            logger.error("EmailAgent: failed to create agent_job for reply draft")
            return

        job_id = job_res.data[0]["id"]

        await write_audit_log(
            agency_id=agency_id,
            student_id=student_id,
            action="email.reply_queued",
            entity_type="email",
            entity_id=email_id,
            new_value={"job_id": job_id, "draft_chars": len(draft)},
        )

        # Send to Telegram for approval
        approval_msg = (
            f"✉️ *Email Reply Needs Approval*\n"
            f"Student: {student.get('full_name', 'Unknown')}\n"
            f"Re: {subject}\n"
            f"From: {account['email_address']}\n"
            f"━━━━━━━━━━━━━━━\n"
            f"*Draft:*\n\n{draft}"
        )

        # Truncate if over Telegram limit before passing to send_approval_request
        if len(approval_msg) > 4000:
            approval_msg = approval_msg[:3997] + "…"

        await send_approval_request(
            agency_id=agency_id,
            job_id=job_id,
            message=approval_msg,
            screenshot_urls=[],
        )

    # ------------------------------------------------------------------ #
    #  SMTP send — called on approval                                      #
    # ------------------------------------------------------------------ #

    async def send_reply_via_smtp(self, email_id: str, job_id: str) -> None:
        """
        Send the approved draft reply via SMTP using the student's email account.
        Called from telegram_bot._handle_callback when agent_type=='email' is approved.
        """
        db = get_service_client()

        # Fetch job output_data to get account and subject
        job_res = db.table("agent_jobs").select(
            "output_data, agency_id, student_id"
        ).eq("id", job_id).single().execute()

        if not job_res.data:
            logger.error(f"EmailAgent.send_reply_via_smtp: job {job_id} not found")
            return

        job = job_res.data
        output = job.get("output_data") or {}
        agency_id = job["agency_id"]
        student_id = job["student_id"]
        email_account_id = output.get("email_account_id")
        reply_subject = output.get("subject", "Re: (no subject)")

        if not email_account_id:
            logger.error(f"EmailAgent.send_reply_via_smtp: no email_account_id in job {job_id}")
            return

        # Fetch draft from emails table
        email_res = db.table("emails").select(
            "id, ai_draft, from_address, subject"
        ).eq("id", email_id).execute()

        if not email_res.data or not email_res.data[0].get("ai_draft"):
            logger.error(f"EmailAgent.send_reply_via_smtp: no draft for email {email_id}")
            return

        email_record = email_res.data[0]
        draft_body = email_record["ai_draft"]
        original_from = email_record.get("from_address", "")

        # Fetch account credentials
        account_res = db.table("email_accounts").select(
            "email_address, password_encrypted, imap_host"
        ).eq("id", email_account_id).execute()

        if not account_res.data:
            logger.error(
                f"EmailAgent.send_reply_via_smtp: account {email_account_id} not found"
            )
            return

        account = account_res.data[0]
        smtp_host, smtp_port = _derive_smtp(account["imap_host"])

        # Decrypt password — cleared immediately after use
        password = decrypt(account["password_encrypted"])
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = reply_subject
            msg["From"] = account["email_address"]
            msg["To"] = original_from  # Reply goes back to the sender

            msg.attach(MIMEText(draft_body, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(account["email_address"], password)
                server.sendmail(
                    account["email_address"],
                    [original_from],
                    msg.as_string(),
                )

            # Mark email as replied
            db.table("emails").update({
                "draft_status": "sent",
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", email_id).execute()

            await write_audit_log(
                agency_id=agency_id,
                student_id=student_id,
                action="email.reply_sent",
                entity_type="email",
                entity_id=email_id,
                new_value={"job_id": job_id, "smtp_host": smtp_host},
            )

            logger.info(
                f"EmailAgent: reply sent for email {email_id} via {smtp_host}"
            )

        except Exception as exc:
            logger.error(
                f"EmailAgent.send_reply_via_smtp: SMTP send failed for email {email_id}: {exc}"
            )
            db.table("emails").update({"draft_status": "send_failed"}).eq(
                "id", email_id
            ).execute()
            await write_audit_log(
                agency_id=agency_id,
                student_id=student_id,
                action="email.reply_send_failed",
                entity_type="email",
                entity_id=email_id,
                new_value={"job_id": job_id, "error": str(exc)},
            )
        finally:
            password = ""  # Clear from memory

    # ------------------------------------------------------------------ #
    #  LLM helpers                                                         #
    # ------------------------------------------------------------------ #

    async def _categorize_email(
        self, subject: str, body: str, from_addr: str
    ) -> str:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        load_soul("EMAIL_AGENT") + "\n\n"
                        f"Classify this email into exactly one of: "
                        f"{', '.join(CATEGORIES)}. "
                        "Respond with only the category name."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"From: {from_addr}\nSubject: {subject}\n\n{body[:500]}"
                    ),
                },
            ],
            temperature=0,
            max_tokens=20,
        )
        result = response.choices[0].message.content.strip().lower()
        return result if result in CATEGORIES else "general"

    async def _draft_reply(self, subject: str, body: str, student: dict) -> str:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        load_soul("EMAIL_AGENT") + "\n\n"
                        f"You are drafting an email reply on behalf of student "
                        f"{student.get('full_name', 'the student')}. "
                        "Be professional, concise, and helpful. "
                        "Include a proper greeting and closing. "
                        "Do not include a subject line."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Original email:\nSubject: {subject}\n\n"
                        f"{body[:1000]}\n\nDraft a reply:"
                    ),
                },
            ],
            temperature=0.7,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()

    # ------------------------------------------------------------------ #
    #  Email parsing utilities                                             #
    # ------------------------------------------------------------------ #

    def _decode_header(self, header_value: str) -> str:
        parts = decode_header(header_value)
        decoded = []
        for part, charset in parts:
            if isinstance(part, bytes):
                decoded.append(part.decode(charset or "utf-8", errors="replace"))
            else:
                decoded.append(str(part))
        return " ".join(decoded)

    def _extract_body(self, msg: email.message.Message) -> str:
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        return payload.decode("utf-8", errors="replace")
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                return payload.decode("utf-8", errors="replace")
        return ""
