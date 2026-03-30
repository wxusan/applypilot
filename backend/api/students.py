"""
Student CRUD API — Phase 2 complete.

ISOLATION GUARANTEE:
- agency_id ALWAYS comes from JWT via get_current_user().
- It is NEVER accepted from request body, query params, or URL.
- Every query filters by user.agency_id before touching the DB.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Students"])


# ──────────────────────────────────────────────────────────────
# Pydantic models — mirror the full DB schema exactly
# ──────────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    full_name: str
    preferred_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[date] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    telegram_username: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    high_school_name: Optional[str] = None
    high_school_country: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    gpa_scale: float = 4.0
    class_rank: Optional[str] = None
    sat_total: Optional[int] = None
    sat_math: Optional[int] = None
    sat_reading: Optional[int] = None
    act_score: Optional[int] = None
    toefl_score: Optional[int] = None
    ielts_score: Optional[float] = None
    duolingo_score: Optional[int] = None
    activities: List[Any] = []
    awards: List[Any] = []
    work_experience: List[Any] = []
    languages: List[Any] = []
    intended_major: Optional[str] = None
    application_type: str = "freshman"
    notes: Optional[str] = None
    status: str = "intake"
    season: Optional[str] = None
    assigned_staff_id: Optional[str] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[date] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    telegram_username: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    high_school_name: Optional[str] = None
    high_school_country: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    gpa_scale: Optional[float] = None
    class_rank: Optional[str] = None
    sat_total: Optional[int] = None
    sat_math: Optional[int] = None
    sat_reading: Optional[int] = None
    act_score: Optional[int] = None
    toefl_score: Optional[int] = None
    ielts_score: Optional[float] = None
    duolingo_score: Optional[int] = None
    activities: Optional[List[Any]] = None
    awards: Optional[List[Any]] = None
    work_experience: Optional[List[Any]] = None
    languages: Optional[List[Any]] = None
    intended_major: Optional[str] = None
    application_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    season: Optional[str] = None
    assigned_staff_id: Optional[str] = None


class BulkImportRequest(BaseModel):
    students: List[dict]


# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

@router.get("/students")
async def list_students(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    season: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = (
        db.table("students")
        .select(
            "id, full_name, preferred_name, email, status, season, "
            "graduation_year, gpa, gpa_scale, sat_total, act_score, "
            "intended_major, nationality, high_school_name, "
            "assigned_staff_id, created_at, updated_at, "
            "applications(id, university_name, status, deadline_regular)",
            count="exact",
        )
        .eq("agency_id", user.agency_id)  # ISOLATION — always from JWT
    )

    if q:
        query = query.ilike("full_name", f"%{q}%")
    if status:
        query = query.eq("status", status)
    if season:
        query = query.eq("season", season)

    result = (
        query.order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {"students": result.data or [], "total": result.count or 0}


@router.post("/students", status_code=201)
async def create_student(
    data: StudentCreate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    payload = data.model_dump()
    payload["agency_id"] = user.agency_id  # ISOLATION — overwrite unconditionally

    for f in ("date_of_birth", "passport_expiry"):
        if payload.get(f) and hasattr(payload[f], "isoformat"):
            payload[f] = payload[f].isoformat()

    result = db.table("students").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create student")

    student = result.data[0]

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=student["id"],
        action="student.created",
        entity_type="student",
        entity_id=student["id"],
        old_value=None,
        new_value={"full_name": student["full_name"], "status": student["status"]},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return student


@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    result = (
        db.table("students")
        .select("*")
        .eq("id", student_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(404, "Student not found")

    return result.data


@router.patch("/students/{student_id}")
async def update_student(
    student_id: str,
    data: StudentUpdate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = (
        db.table("students")
        .select("*")
        .eq("id", student_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Student not found")

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    for f in ("date_of_birth", "passport_expiry"):
        if payload.get(f) and hasattr(payload[f], "isoformat"):
            payload[f] = payload[f].isoformat()

    result = (
        db.table("students")
        .update(payload)
        .eq("id", student_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Update failed")

    changed_old = {k: existing.data.get(k) for k in payload if k != "updated_at"}
    changed_new = {k: payload[k] for k in payload if k != "updated_at"}

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=student_id,
        action="student.updated",
        entity_type="student",
        entity_id=student_id,
        old_value=changed_old,
        new_value=changed_new,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return result.data[0]


@router.delete("/students/{student_id}", status_code=204)
async def delete_student(
    student_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = (
        db.table("students")
        .select("id, full_name, status")
        .eq("id", student_id)
        .eq("agency_id", user.agency_id)  # ISOLATION
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(404, "Student not found")

    db.table("students").delete().eq("id", student_id).eq(
        "agency_id", user.agency_id
    ).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=student_id,
        action="student.deleted",
        entity_type="student",
        entity_id=student_id,
        old_value={"full_name": existing.data["full_name"], "status": existing.data["status"]},
        new_value=None,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/students/import", status_code=201)
async def bulk_import_students(
    data: BulkImportRequest,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """
    Bulk import students from a JSON array.
    Validates each row has at least full_name.
    Returns created count and any errors.
    """
    db = get_service_client()

    if not data.students:
        return {"created": 0, "errors": []}

    if len(data.students) > 100:
        raise HTTPException(400, "Maximum 100 students per import")

    created_count = 0
    errors = []

    for row_idx, student_data in enumerate(data.students):
        try:
            # Validate required field
            if not isinstance(student_data, dict) or not student_data.get("full_name"):
                errors.append({
                    "row": row_idx + 1,
                    "name": student_data.get("full_name", "unknown") if isinstance(student_data, dict) else "unknown",
                    "error": "full_name is required"
                })
                continue

            # Use StudentCreate to validate the schema
            try:
                validated = StudentCreate(**student_data)
            except Exception as ve:
                errors.append({
                    "row": row_idx + 1,
                    "name": student_data.get("full_name", "unknown"),
                    "error": f"Validation error: {str(ve)[:100]}"
                })
                continue

            # Prepare payload
            payload = validated.model_dump()
            payload["agency_id"] = user.agency_id  # ISOLATION — overwrite unconditionally

            # Convert date fields to ISO format
            for f in ("date_of_birth", "passport_expiry"):
                if payload.get(f) and hasattr(payload[f], "isoformat"):
                    payload[f] = payload[f].isoformat()

            # Insert student
            result = db.table("students").insert(payload).execute()
            if not result.data:
                errors.append({
                    "row": row_idx + 1,
                    "name": student_data.get("full_name", "unknown"),
                    "error": "Database insert failed"
                })
                continue

            student = result.data[0]
            created_count += 1

            # Audit log for this imported student
            await write_audit_log(
                agency_id=user.agency_id,
                user_id=user.id,
                student_id=student["id"],
                action="student.imported",
                entity_type="student",
                entity_id=student["id"],
                old_value=None,
                new_value={"full_name": student["full_name"], "status": student["status"]},
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )

        except Exception as e:
            errors.append({
                "row": row_idx + 1,
                "name": student_data.get("full_name", "unknown") if isinstance(student_data, dict) else "unknown",
                "error": str(e)[:100]
            })

    return {"created": created_count, "errors": errors}
