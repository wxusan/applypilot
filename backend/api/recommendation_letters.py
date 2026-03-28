"""
Recommendation Letters API — manage LOR requests for students.
Architecture reference: Section 15.2

Endpoints:
  GET  /api/recommendation-letters             — list (filter by student_id)
  POST /api/recommendation-letters             — create a new LOR request
  GET  /api/recommendation-letters/{id}        — get one
  PATCH /api/recommendation-letters/{id}       — update status / add content
  DELETE /api/recommendation-letters/{id}      — delete
  POST /api/recommendation-letters/{id}/approve — approve letter content
  POST /api/recommendation-letters/{id}/remind  — send reminder to recommender (via Telegram/email)
"""

from __future__ import annotations

import logging
from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Recommendation Letters"], prefix="/recommendation-letters")


# ─── Pydantic models ─────────────────────────────────────────────────────────

class LORCreate(BaseModel):
    student_id: str
    recommender_name: str
    recommender_email: Optional[str] = None
    recommender_title: Optional[str] = None
    recommender_school: Optional[str] = None
    relationship: Optional[str] = None   # teacher | counselor | employer | mentor | other
    deadline: Optional[date] = None
    application_id: Optional[str] = None
    notes: Optional[str] = None
    waiver_signed: bool = False


class LORUpdate(BaseModel):
    status: Optional[str] = None         # not_requested | requested | in_progress | submitted | approved | declined
    recommender_name: Optional[str] = None
    recommender_email: Optional[str] = None
    recommender_title: Optional[str] = None
    recommender_school: Optional[str] = None
    relationship: Optional[str] = None
    deadline: Optional[date] = None
    notes: Optional[str] = None
    waiver_signed: Optional[bool] = None
    letter_content: Optional[str] = None


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _require_lor(db, lor_id: str, agency_id: str) -> dict:
    """Fetch a LOR request, raise 404 if not found or wrong agency."""
    result = (
        db.table("recommendation_letter_requests")
        .select("*")
        .eq("id", lor_id)
        .eq("agency_id", agency_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Recommendation letter request not found")
    return result.data


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/")
async def list_lors(
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    user: AuthUser = Depends(get_current_user),
):
    """List LOR requests for this agency, optionally filtered by student or status."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    query = (
        db.table("recommendation_letter_requests")
        .select("*")
        .eq("agency_id", user.agency_id)
        .order("created_at", desc=True)
    )
    if student_id:
        query = query.eq("student_id", student_id)
    if status:
        query = query.eq("status", status)

    return query.execute().data or []


@router.post("/", status_code=201)
async def create_lor(
    body: LORCreate,
    user: AuthUser = Depends(get_current_user),
):
    """Create a new recommendation letter request."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    # Verify student belongs to agency
    db = get_service_client()
    student = (
        db.table("students")
        .select("id, first_name, last_name")
        .eq("id", body.student_id)
        .eq("agency_id", user.agency_id)
        .maybe_single()
        .execute()
    )
    if not student.data:
        raise HTTPException(404, "Student not found")

    payload = body.model_dump(exclude_none=True)
    payload["agency_id"] = user.agency_id
    if isinstance(payload.get("deadline"), date):
        payload["deadline"] = payload["deadline"].isoformat()

    result = db.table("recommendation_letter_requests").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create LOR request")

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="create",
        entity_type="recommendation_letter_request",
        entity_id=result.data[0]["id"],
        new_value=result.data[0],
    )
    return result.data[0]


@router.get("/{lor_id}")
async def get_lor(
    lor_id: str,
    user: AuthUser = Depends(get_current_user),
):
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")
    db = get_service_client()
    return _require_lor(db, lor_id, user.agency_id)


@router.patch("/{lor_id}")
async def update_lor(
    lor_id: str,
    body: LORUpdate,
    user: AuthUser = Depends(get_current_user),
):
    """Update a LOR request (status, content, recommender details, etc.)"""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    old = _require_lor(db, lor_id, user.agency_id)

    payload = body.model_dump(exclude_none=True)
    if isinstance(payload.get("deadline"), date):
        payload["deadline"] = payload["deadline"].isoformat()

    # Auto-set submitted_at when status moves to 'submitted'
    if payload.get("status") == "submitted" and not old.get("submitted_at"):
        from datetime import datetime, timezone
        payload["submitted_at"] = datetime.now(timezone.utc).isoformat()

    if not payload:
        return old

    result = (
        db.table("recommendation_letter_requests")
        .update(payload)
        .eq("id", lor_id)
        .execute()
    )

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="update",
        entity_type="recommendation_letter_request",
        entity_id=lor_id,
        old_value=old,
        new_value=result.data[0] if result.data else payload,
    )
    return result.data[0] if result.data else {**old, **payload}


@router.delete("/{lor_id}", status_code=204)
async def delete_lor(
    lor_id: str,
    user: AuthUser = Depends(get_current_user),
):
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    old = _require_lor(db, lor_id, user.agency_id)
    db.table("recommendation_letter_requests").delete().eq("id", lor_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="delete",
        entity_type="recommendation_letter_request",
        entity_id=lor_id,
        old_value=old,
    )


@router.post("/{lor_id}/approve")
async def approve_lor(
    lor_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Mark a submitted letter as approved."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    lor = _require_lor(db, lor_id, user.agency_id)

    if lor["status"] != "submitted":
        raise HTTPException(400, "Letter must be in 'submitted' status to approve")

    from datetime import datetime, timezone
    result = (
        db.table("recommendation_letter_requests")
        .update({
            "status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": user.id,
        })
        .eq("id", lor_id)
        .execute()
    )

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="approve",
        entity_type="recommendation_letter_request",
        entity_id=lor_id,
        old_value=lor,
        new_value=result.data[0] if result.data else {},
    )
    return result.data[0] if result.data else lor


@router.post("/{lor_id}/remind")
async def send_reminder(
    lor_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Send a reminder to the recommender via Telegram notification."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    lor = _require_lor(db, lor_id, user.agency_id)

    # Look up the student for the Telegram message
    student = (
        db.table("students")
        .select("first_name, last_name")
        .eq("id", lor["student_id"])
        .maybe_single()
        .execute()
    )
    student_name = "Unknown"
    if student.data:
        student_name = f"{student.data['first_name']} {student.data['last_name']}"

    deadline_str = f" (due {lor['deadline']})" if lor.get("deadline") else ""
    message = (
        f"📝 LOR Reminder\n"
        f"Recommender: {lor['recommender_name']}\n"
        f"Student: {student_name}\n"
        f"Status: {lor['status']}{deadline_str}\n"
        f"Please follow up with the recommender."
    )

    # Send via Telegram if the requesting user has a chat ID
    counselor = (
        db.table("users")
        .select("telegram_chat_id")
        .eq("id", user.id)
        .maybe_single()
        .execute()
    )
    if counselor.data and counselor.data.get("telegram_chat_id"):
        try:
            from services.telegram_bot import send_message_to_agency_staff
            await send_message_to_agency_staff(user.agency_id, message)
        except Exception as e:
            logger.warning(f"[LOR] Telegram reminder failed: {e}")

    return {"sent": True, "message": message}
