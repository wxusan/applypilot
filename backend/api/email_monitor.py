"""
Email Monitor API — Phase 4C (wired)
Classified emails found in student's Gmail inbox via IMAP.

Endpoints:
  GET  /api/email-monitor?student_id=    — list classified emails
  POST /api/email-monitor/{id}/action    — mark actioned
  POST /api/email-monitor/scan           — trigger manual Gmail scan (now live)
"""

import asyncio
import email as email_lib
import imaplib
import logging
import uuid
from datetime import datetime, timezone
from email.header import decode_header as decode_mime_header
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel

from core.auth import get_current_user
from core.config import settings
from core.db import get_service_client
from core.encryption import decrypt
from models.user import AuthUser

logger = logging.getLogger(__name__)
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

router = APIRouter(tags=["Email Monitor"])

# Map DB/OpenAI classification → frontend classification values
_CLASSIFICATION_MAP = {
    "admission_decision": "decision",
    "portal_link": "portal_activation",
    "portal_activation": "portal_activation",
    "payment_reminder": "general_university",
    "document_request": "document_request",
    "decision": "decision",
    "general_university": "general_university",
    "other": "general_university",
    "ignore": "ignore",
}


# ──────────────────────────────────────────────
# GET /api/email-monitor
# ──────────────────────────────────────────────

@router.get("/email-monitor")
async def list_emails(student_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    result = db.table("monitored_emails")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("agency_id", user.agency_id)\
        .order("received_at", desc=True)\
        .execute()
    return result.data or []


# ──────────────────────────────────────────────
# POST /api/email-monitor/{id}/action
# ──────────────────────────────────────────────

class ActionBody(BaseModel):
    action_note: Optional[str] = None


@router.post("/email-monitor/{email_id}/action")
async def action_email(email_id: str, body: ActionBody, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    record = db.table("monitored_emails").select("id, agency_id").eq("id", email_id).eq("agency_id", user.agency_id).single().execute()
    if not record.data:
        raise HTTPException(404, "Email not found")
    db.table("monitored_emails").update({
        "is_actioned": True,
        "actioned_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", email_id).execute()
    return {"success": True}


# ──────────────────────────────────────────────
# POST /api/email-monitor/scan
# ──────────────────────────────────────────────

@router.post("/email-monitor/scan")
async def trigger_scan(student_id: str, user: AuthUser = Depends(get_current_user)):
    """
    Trigger a real Gmail IMAP scan for this student.
    Creates an agent_job, launches the scan in the background,
    and returns immediately with the job_id.
    """
    db = get_service_client()

    # Verify student belongs to this agency
    student = db.table("students").select("id, full_name, agency_id")\
        .eq("id", student_id)\
        .eq("agency_id", user.agency_id)\
        .single().execute()
    if not student.data:
        raise HTTPException(404, "Student not found")

    # Fetch active Gmail credentials for this student
    cred_result = db.table("student_credentials")\
        .select("id, gmail_email, gmail_password")\
        .eq("student_id", student_id)\
        .eq("agency_id", user.agency_id)\
        .eq("is_active", True)\
        .limit(1)\
        .execute()

    if not cred_result.data:
        raise HTTPException(400, "No active Gmail credentials found for this student. Add them in Credentials first.")

    cred = cred_result.data[0]

    # Decrypt password in memory only
    try:
        gmail_password = decrypt(cred["gmail_password"])
    except Exception:
        raise HTTPException(500, "Failed to decrypt Gmail credentials. Please re-save credentials.")

    # Create a tracking agent_job
    now = datetime.now(timezone.utc).isoformat()
    job_res = db.table("agent_jobs").insert({
        "agency_id": user.agency_id,
        "student_id": student_id,
        "agent_type": "email_monitor",
        "job_type": "gmail_scan",
        "status": "pending",
        "requires_approval": False,
        "created_at": now,
        "input_data": {
            "student_id": student_id,
            "gmail_email": cred["gmail_email"],
        },
    }).execute()

    if not job_res.data:
        raise HTTPException(500, "Failed to create scan job")

    job_id = job_res.data[0]["id"]

    # Launch background task — returns immediately
    asyncio.create_task(
        _run_gmail_scan(
            job_id=job_id,
            student_id=student_id,
            agency_id=user.agency_id,
            gmail_email=cred["gmail_email"],
            gmail_password=gmail_password,
        )
    )

    return {
        "success": True,
        "job_id": job_id,
        "message": f"Gmail scan started for {student.data['full_name']}. Emails will appear shortly.",
    }


# ──────────────────────────────────────────────
# Background: IMAP scan + OpenAI classify + save
# ──────────────────────────────────────────────

async def _run_gmail_scan(
    job_id: str,
    student_id: str,
    agency_id: str,
    gmail_email: str,
    gmail_password: str,
) -> None:
    """
    Background task:
    1. Connect to Gmail via IMAP
    2. Fetch up to 30 recent unread emails
    3. Classify each with OpenAI
    4. Save new emails to monitored_emails (skip duplicates)
    5. Mark job complete
    """
    db = get_service_client()

    # Mark job running
    db.table("agent_jobs").update({
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).execute()

    try:
        # Run IMAP fetch in a thread (blocking I/O)
        raw_emails = await asyncio.to_thread(
            _imap_fetch_unread, gmail_email, gmail_password, limit=30
        )

        saved_count = 0
        for msg in raw_emails:
            classification_raw, university_name, content_summary = await _classify_email(
                subject=msg["subject"],
                from_address=msg["from_address"],
                body_preview=msg["body_preview"],
            )
            classification = _CLASSIFICATION_MAP.get(classification_raw, "general_university")

            try:
                db.table("monitored_emails").insert({
                    "id": str(uuid.uuid4()),
                    "student_id": student_id,
                    "agency_id": agency_id,
                    "gmail_message_id": msg["message_id"],
                    "from_address": msg["from_address"],
                    "subject": msg["subject"],
                    "received_at": msg["received_at"],
                    "body_preview": msg["body_preview"],
                    "classification": classification,
                    "university_name": university_name,
                    "content_summary": content_summary,
                    "is_actioned": False,
                }).execute()
                saved_count += 1
            except Exception as insert_err:
                # Duplicate gmail_message_id — skip silently
                logger.debug(f"Skipping duplicate email {msg['message_id']}: {insert_err}")

        db.table("agent_jobs").update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "output_data": {"emails_saved": saved_count, "emails_fetched": len(raw_emails)},
        }).eq("id", job_id).execute()

        logger.info(f"Gmail scan complete for student {student_id}: {saved_count} new emails saved")

    except Exception as exc:
        logger.error(f"Gmail scan failed for job {job_id}: {exc}")
        db.table("agent_jobs").update({
            "status": "failed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "error_message": str(exc),
        }).eq("id", job_id).execute()


def _decode_header_value(value: str) -> str:
    """Decode RFC 2047 encoded email header."""
    if not value:
        return ""
    parts = decode_mime_header(value)
    decoded = []
    for part, charset in parts:
        if isinstance(part, bytes):
            decoded.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            decoded.append(part)
    return "".join(decoded)


def _imap_fetch_unread(gmail_email: str, gmail_password: str, limit: int = 30) -> list:
    """
    Blocking IMAP fetch — run in a thread via asyncio.to_thread().
    Returns list of dicts with: message_id, from_address, subject, received_at, body_preview.
    """
    results = []
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        mail.login(gmail_email, gmail_password)
        mail.select("INBOX")

        # Search for UNSEEN emails (or ALL for recent emails too)
        _, msg_ids = mail.search(None, "ALL")
        all_ids = msg_ids[0].split()

        # Take the most recent `limit` emails
        recent_ids = all_ids[-limit:] if len(all_ids) > limit else all_ids
        recent_ids = list(reversed(recent_ids))  # newest first

        for uid in recent_ids:
            try:
                _, data = mail.fetch(uid, "(RFC822)")
                raw = data[0][1]
                msg = email_lib.message_from_bytes(raw)

                subject = _decode_header_value(msg.get("Subject", "(no subject)"))
                from_addr = _decode_header_value(msg.get("From", ""))
                date_str = msg.get("Date", "")
                message_id = msg.get("Message-ID", f"imap_{uid.decode()}")

                # Parse date
                try:
                    from email.utils import parsedate_to_datetime
                    received_dt = parsedate_to_datetime(date_str).isoformat()
                except Exception:
                    received_dt = datetime.now(timezone.utc).isoformat()

                # Extract body preview
                body_preview = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            payload = part.get_payload(decode=True)
                            if payload:
                                body_preview = payload.decode("utf-8", errors="replace")[:500]
                                break
                else:
                    payload = msg.get_payload(decode=True)
                    if payload:
                        body_preview = payload.decode("utf-8", errors="replace")[:500]

                results.append({
                    "message_id": message_id.strip("<>"),
                    "from_address": from_addr[:255],
                    "subject": subject[:500],
                    "received_at": received_dt,
                    "body_preview": body_preview.strip()[:500],
                })
            except Exception as e:
                logger.warning(f"Error fetching email uid {uid}: {e}")
                continue

        mail.logout()
    except imaplib.IMAP4.error as e:
        raise RuntimeError(f"Gmail IMAP login failed: {e}. Check credentials or enable 'Less secure app access' / App Password.")
    except Exception as e:
        raise RuntimeError(f"IMAP fetch error: {e}")

    return results


async def _classify_email(subject: str, from_address: str, body_preview: str) -> tuple:
    """
    Use OpenAI GPT-4o-mini to classify an email.
    Returns (classification, university_name, content_summary).
    """
    try:
        prompt = f"""Classify this university-related email for a college application tracking system.

From: {from_address}
Subject: {subject}
Body preview: {body_preview[:300]}

Return a JSON object with exactly these fields:
- "classification": one of: "portal_activation", "document_request", "decision", "general_university", "ignore"
  * portal_activation = email contains a portal login link or PIN to activate an application portal
  * document_request = university is asking for additional documents or information
  * decision = admission decision (acceptance, rejection, waitlist, deferral)
  * general_university = other updates from a university (financial aid, events, etc.)
  * ignore = marketing, newsletters, spam, non-university emails
- "university_name": the university name extracted from the email, or null if not identifiable
- "content_summary": a 1-sentence summary of the email, max 100 characters

Respond ONLY with the JSON object, no markdown."""

        response = await openai_client.chat.completions.create(
            model=settings.AI_MODEL_FAST,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=150,
        )

        import json
        content = response.choices[0].message.content.strip()
        parsed = json.loads(content)

        return (
            parsed.get("classification", "general_university"),
            parsed.get("university_name"),
            parsed.get("content_summary"),
        )
    except Exception as e:
        logger.warning(f"OpenAI classification failed: {e}")
        return "general_university", None, None
