"""
Deadlines API — Phase 3.
Full CRUD: create, update, delete, mark complete/incomplete.
alert_days_before customizable per deadline.
agency_id always from JWT.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Deadlines"])


class DeadlineCreate(BaseModel):
    student_id: str
    application_id: Optional[str] = None
    title: str
    type: Optional[str] = None
    due_date: date
    due_time: Optional[str] = None
    timezone: str = "Asia/Tashkent"
    alert_days_before: List[int] = [30, 14, 7, 3, 1]


class DeadlineUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    timezone: Optional[str] = None
    alert_days_before: Optional[List[int]] = None
    application_id: Optional[str] = None


@router.get("/deadlines")
async def list_deadlines(
    student_id: Optional[str] = Query(None),
    upcoming_only: bool = Query(False),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = db.table("deadlines").select(
        "id, student_id, application_id, title, type, due_date, due_time, "
        "alert_days_before, is_complete, completed_at, created_at, "
        "student:students(full_name)"
    ).eq("agency_id", user.agency_id)  # ISOLATION

    if student_id:
        query = query.eq("student_id", student_id)
    if upcoming_only:
        query = query.eq("is_complete", False)

    result = query.order("due_date", desc=False).execute()
    return {"deadlines": result.data}


@router.post("/deadlines", status_code=201)
async def create_deadline(
    data: DeadlineCreate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    # Verify student (ISOLATION)
    student = db.table("students").select("id").eq(
        "id", data.student_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not student.data:
        raise HTTPException(status_code=404, detail="Student not found")

    # If application_id provided, verify it belongs to this agency
    if data.application_id:
        app = db.table("applications").select("id").eq(
            "id", data.application_id
        ).eq("agency_id", user.agency_id).single().execute()
        if not app.data:
            raise HTTPException(status_code=404, detail="Application not found")

    result = db.table("deadlines").insert({
        "agency_id": user.agency_id,  # ISOLATION — always from JWT
        "student_id": data.student_id,
        "application_id": data.application_id,
        "title": data.title,
        "type": data.type,
        "due_date": data.due_date.isoformat(),
        "due_time": data.due_time,
        "timezone": data.timezone,
        "alert_days_before": data.alert_days_before,
        "alerts_sent": [],
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create deadline")

    deadline = result.data[0]

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=data.student_id,
        action="deadline.created",
        entity_type="deadline",
        entity_id=deadline["id"],
        old_value=None,
        new_value={"title": data.title, "due_date": data.due_date.isoformat()},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return deadline


@router.patch("/deadlines/{deadline_id}")
async def update_deadline(
    deadline_id: str,
    data: DeadlineUpdate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = db.table("deadlines").select("*").eq(
        "id", deadline_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Deadline not found")

    payload: dict = {}
    update_data = data.model_dump(exclude_none=True)

    for field, value in update_data.items():
        if field == "due_date":
            payload["due_date"] = value.isoformat() if isinstance(value, date) else value
        else:
            payload[field] = value

    if not payload:
        return existing.data

    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Reset alerts_sent if due_date changed (re-arm all alerts)
    if "due_date" in payload:
        payload["alerts_sent"] = []

    result = db.table("deadlines").update(payload).eq(
        "id", deadline_id
    ).eq("agency_id", user.agency_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Deadline not found")

    old_value = {k: existing.data.get(k) for k in payload if k not in ("updated_at", "alerts_sent")}
    new_value = {k: v for k, v in payload.items() if k not in ("updated_at", "alerts_sent")}

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        action="deadline.updated",
        entity_type="deadline",
        entity_id=deadline_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return result.data[0] if result.data else existing.data


@router.delete("/deadlines/{deadline_id}", status_code=204)
async def delete_deadline(
    deadline_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = db.table("deadlines").select("id, title, student_id").eq(
        "id", deadline_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Deadline not found")

    db.table("deadlines").delete().eq(
        "id", deadline_id
    ).eq("agency_id", user.agency_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        action="deadline.deleted",
        entity_type="deadline",
        entity_id=deadline_id,
        old_value={"title": existing.data["title"]},
        new_value=None,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/deadlines/{deadline_id}/complete")
async def complete_deadline(
    deadline_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = db.table("deadlines").select("id, student_id, title").eq(
        "id", deadline_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Deadline not found")

    result = db.table("deadlines").update({
        "is_complete": True,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "completed_by": user.id,
    }).eq("id", deadline_id).eq("agency_id", user.agency_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        action="deadline.completed",
        entity_type="deadline",
        entity_id=deadline_id,
        old_value={"is_complete": False},
        new_value={"is_complete": True},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return result.data[0] if result.data else existing.data


@router.post("/deadlines/{deadline_id}/uncomplete")
async def uncomplete_deadline(
    deadline_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """Revert a completed deadline back to incomplete."""
    db = get_service_client()

    existing = db.table("deadlines").select("id, student_id").eq(
        "id", deadline_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Deadline not found")

    result = db.table("deadlines").update({
        "is_complete": False,
        "completed_at": None,
        "completed_by": None,
    }).eq("id", deadline_id).eq("agency_id", user.agency_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        action="deadline.uncompleted",
        entity_type="deadline",
        entity_id=deadline_id,
        old_value={"is_complete": True},
        new_value={"is_complete": False},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return result.data[0] if result.data else existing.data
