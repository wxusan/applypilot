"""
Email Monitor API — Phase 4B/4C
Classified emails found in student's Gmail inbox.

Endpoints:
  GET  /api/email-monitor?student_id=    — list classified emails
  POST /api/email-monitor/{id}/action    — mark actioned
  POST /api/email-monitor/scan           — trigger manual Gmail scan (stub until 4C)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Email Monitor"])


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


class ActionBody(BaseModel):
    action_note: Optional[str] = None


@router.post("/email-monitor/{email_id}/action")
async def action_email(email_id: str, body: ActionBody, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    email = db.table("monitored_emails").select("id, agency_id").eq("id", email_id).eq("agency_id", user.agency_id).single().execute()
    if not email.data:
        raise HTTPException(404, "Email not found")
    db.table("monitored_emails").update({"is_actioned": True, "actioned_at": datetime.now(timezone.utc).isoformat()}).eq("id", email_id).execute()
    return {"success": True}


@router.post("/email-monitor/scan")
async def trigger_scan(student_id: str, user: AuthUser = Depends(get_current_user)):
    """Trigger a Gmail scan for this student. Stub until Phase 4C gmail_agent is live."""
    db = get_service_client()
    student = db.table("students").select("id, agency_id").eq("id", student_id).eq("agency_id", user.agency_id).single().execute()
    if not student.data:
        raise HTTPException(404, "Student not found")
    # Phase 4C will trigger the actual gmail_agent scan here
    return {"success": True, "message": "Scan queued. Gmail agent will process shortly."}
