"""
Applications API — Phase 2.
agency_id always from JWT. Full audit logging on every write.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import date, datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from core.encryption import encrypt
from models.user import AuthUser

router = APIRouter(tags=["Applications"])

COMMON_APP_DEFAULT_STATUS = {
    "personal_info": "not_started",
    "family": "not_started",
    "education": "not_started",
    "test_scores": "not_started",
    "activities": "not_started",
    "writing": "not_started",
    "additional_info": "not_started",
    "school_report": "not_started",
    "recommendations": "not_started",
    "payment": "not_started",
}

VALID_STATUSES = {
    "not_started", "in_progress", "submitted", "accepted",
    "rejected", "waitlisted", "deferred",
}


class ApplicationCreate(BaseModel):
    student_id: str
    university_name: str
    university_id: Optional[str] = None
    application_type: str = "regular"
    deadline_regular: Optional[date] = None
    deadline_financial_aid: Optional[date] = None
    deadline_scholarship: Optional[date] = None
    portal_url: Optional[str] = None
    portal_username: Optional[str] = None
    portal_password: Optional[str] = None  # Plaintext — encrypted before storage
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    university_name: Optional[str] = None
    application_type: Optional[str] = None
    deadline_regular: Optional[date] = None
    deadline_financial_aid: Optional[date] = None
    deadline_scholarship: Optional[date] = None
    portal_url: Optional[str] = None
    portal_username: Optional[str] = None
    portal_password: Optional[str] = None  # Plaintext — encrypted before storage
    status: Optional[str] = None
    decision: Optional[str] = None
    decision_received_at: Optional[datetime] = None
    scholarship_amount: Optional[float] = None
    financial_aid_amount: Optional[float] = None
    notes: Optional[str] = None
    application_fee_paid: Optional[bool] = None
    fee_waiver_used: Optional[bool] = None
    common_app_status: Optional[Dict[str, str]] = None


@router.get("/applications")
async def list_applications(
    student_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = (
        db.table("applications")
        .select(
            "id, student_id, university_name, university_id, application_type, "
            "status, deadline_regular, deadline_financial_aid, deadline_scholarship, "
            "common_app_status, decision, submitted_at, decision_received_at, "
            "scholarship_amount, financial_aid_amount, "
            "application_fee_paid, fee_waiver_used, portal_url, portal_username, "
            "notes, created_at, updated_at"
        )
        .eq("agency_id", user.agency_id)  # ISOLATION
    )

    if student_id:
        query = query.eq("student_id", student_id)
    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=False).execute()
    return {"applications": result.data or []}


@router.post("/applications", status_code=201)
async def create_application(
    data: ApplicationCreate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    # Verify student belongs to this agency (ISOLATION)
    student = (
        db.table("students")
        .select("id, full_name")
        .eq("id", data.student_id)
        .eq("agency_id", user.agency_id)
        .single()
        .execute()
    )
    if not student.data:
        raise HTTPException(404, "Student not found")

    payload = {
        "agency_id": user.agency_id,  # ISOLATION
        "student_id": data.student_id,
        "university_name": data.university_name,
        "university_id": data.university_id,
        "application_type": data.application_type,
        "deadline_regular": data.deadline_regular.isoformat() if data.deadline_regular else None,
        "deadline_financial_aid": data.deadline_financial_aid.isoformat() if data.deadline_financial_aid else None,
        "deadline_scholarship": data.deadline_scholarship.isoformat() if data.deadline_scholarship else None,
        "portal_url": data.portal_url,
        "portal_username": data.portal_username,
        "portal_password_encrypted": encrypt(data.portal_password) if data.portal_password else None,
        "notes": data.notes,
        "common_app_status": COMMON_APP_DEFAULT_STATUS,
        "status": "not_started",
    }

    result = db.table("applications").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create application")

    app = result.data[0]

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=data.student_id,
        application_id=app["id"],
        action="application.created",
        entity_type="application",
        entity_id=app["id"],
        old_value=None,
        new_value={"university_name": data.university_name, "type": data.application_type},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return app


@router.get("/applications/{application_id}")
async def get_application(
    application_id: str,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    result = (
        db.table("applications")
        .select("*")
        .eq("id", application_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Application not found")

    app = dict(result.data)
    app.pop("portal_password_encrypted", None)  # Never expose encrypted credential
    return app


@router.patch("/applications/{application_id}")
async def update_application(
    application_id: str,
    data: ApplicationUpdate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = (
        db.table("applications")
        .select("*")
        .eq("id", application_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Application not found")

    payload: dict = {}
    for field, value in data.model_dump().items():
        if value is None:
            continue
        if field == "portal_password":
            payload["portal_password_encrypted"] = encrypt(value)
        elif field in ("deadline_regular", "deadline_financial_aid", "deadline_scholarship"):
            payload[field] = value.isoformat() if value else None
        elif field == "decision_received_at":
            payload[field] = value.isoformat() if value else None
        else:
            payload[field] = value

    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        db.table("applications")
        .update(payload)
        .eq("id", application_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .execute()
    )

    safe_new = {k: v for k, v in payload.items() if k not in ("portal_password_encrypted", "updated_at")}
    safe_old = {k: existing.data.get(k) for k in safe_new}

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        application_id=application_id,
        action="application.updated",
        entity_type="application",
        entity_id=application_id,
        old_value=safe_old,
        new_value=safe_new,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update application")
    out = dict(result.data[0])
    out.pop("portal_password_encrypted", None)
    return out


@router.delete("/applications/{application_id}", status_code=204)
async def delete_application(
    application_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = (
        db.table("applications")
        .select("id, university_name, student_id")
        .eq("id", application_id)
        .eq("agency_id", user.agency_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Application not found")

    db.table("applications").delete().eq("id", application_id).eq(
        "agency_id", user.agency_id
    ).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        application_id=application_id,
        action="application.deleted",
        entity_type="application",
        entity_id=application_id,
        old_value={"university_name": existing.data["university_name"]},
        new_value=None,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


COMMON_APP_SECTIONS = {
    "personal_info", "family", "education", "test_scores", "activities",
    "writing", "additional_info", "school_report", "recommendations", "payment",
}
VALID_SECTION_STATUSES = {"not_started", "in_progress", "completed"}


class SectionUpdate(BaseModel):
    section: str
    status: str  # not_started | in_progress | completed


@router.patch("/applications/{application_id}/sections")
async def update_section_status(
    application_id: str,
    data: SectionUpdate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """Update the status of one Common App section for an application."""
    if data.section not in COMMON_APP_SECTIONS:
        raise HTTPException(400, f"Unknown section: {data.section}")
    if data.status not in VALID_SECTION_STATUSES:
        raise HTTPException(400, f"Invalid status: {data.status}")

    db = get_service_client()

    existing = (
        db.table("applications")
        .select("id, student_id, common_app_status")
        .eq("id", application_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Application not found")

    current_status: dict = existing.data.get("common_app_status") or {}
    old_section_status = current_status.get(data.section, "not_started")

    # Merge section update into existing JSON
    updated_status = {**current_status, data.section: data.status}

    result = (
        db.table("applications")
        .update({
            "common_app_status": updated_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", application_id)
        .eq("agency_id", user.agency_id)
        .execute()
    )

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        application_id=application_id,
        action="application.section_updated",
        entity_type="application",
        entity_id=application_id,
        old_value={"section": data.section, "status": old_section_status},
        new_value={"section": data.section, "status": data.status},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update section status")
    out = dict(result.data[0])
    out.pop("portal_password_encrypted", None)
    return out
