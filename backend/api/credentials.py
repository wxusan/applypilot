"""
Credentials API — Phase 4A
Secure storage of Gmail and Common App credentials for students, teachers, counsellors.

Endpoints:
  POST   /api/credentials                  — add credential set
  GET    /api/credentials?student_id=      — list (passwords masked)
  PATCH  /api/credentials/{id}             — update
  DELETE /api/credentials/{id}             — remove
  POST   /api/credentials/{id}/test        — test Gmail login
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
import uuid
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser
from services.credential_vault import encrypt, decrypt

router = APIRouter(tags=["Credentials"])


class CredentialCreate(BaseModel):
    student_id: str
    credential_type: str = Field(max_length=20)  # 'student' | 'teacher' | 'counsellor'
    label: str = Field(min_length=1, max_length=100)  # e.g. "Mr. Johnson (Physics Teacher)"
    gmail_email: EmailStr
    gmail_password: str = Field(min_length=1, max_length=256)
    # Student only: does the student already have a Common App account?
    # false → platform will create one via browser automation
    # true  → platform logs into the existing account
    has_common_app: bool = False
    common_app_email: Optional[EmailStr] = None   # only used when has_common_app=True
    common_app_password: Optional[str] = Field(default=None, max_length=256)  # only used when has_common_app=True
    # Teacher/counsellor only: subject they teach or their title
    # e.g. "Physics Teacher", "School Counselor" — used to fill recommender profile
    role: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)


class CredentialUpdate(BaseModel):
    label: Optional[str] = Field(default=None, min_length=1, max_length=100)
    gmail_email: Optional[EmailStr] = None
    gmail_password: Optional[str] = Field(default=None, min_length=1, max_length=256)
    has_common_app: Optional[bool] = None
    common_app_email: Optional[EmailStr] = None
    common_app_password: Optional[str] = Field(default=None, max_length=256)
    role: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)


def _mask(value: Optional[str]) -> Optional[str]:
    """Return masked password for display."""
    if not value:
        return None
    return '••••••••'


def _log_access(
    db,
    agency_id: str,
    credential_id: str,
    user_id: str,
    action: str,
    request: Request | None = None,
) -> None:
    """Fire-and-forget credential access log entry (best-effort, never raises)."""
    try:
        db.table("credential_access_log").insert({
            "agency_id": agency_id,
            "credential_id": credential_id,
            "user_id": user_id,
            "action": action,
            "ip_address": request.client.host if request and request.client else None,
            "user_agent": request.headers.get("user-agent") if request else None,
        }).execute()
    except Exception:
        pass  # Never let audit logging break the main flow


def _serialize(row: dict, show_masked: bool = True) -> dict:
    """Serialize a credential row, masking passwords."""
    return {
        'id': row.get('id'),
        'student_id': row.get('student_id'),
        'credential_type': row.get('credential_type'),
        'label': row.get('label'),
        'gmail_email': row.get('gmail_email'),
        'gmail_password': _mask(row.get('gmail_password')) if show_masked else decrypt(row.get('gmail_password', '')),
        'has_common_app': row.get('has_common_app', False),
        'common_app_email': row.get('common_app_email'),
        'common_app_password': _mask(row.get('common_app_password')) if show_masked else decrypt(row.get('common_app_password', '')),
        'role': row.get('role'),
        'notes': row.get('notes'),
        'is_active': row.get('is_active'),
        'last_tested_at': row.get('last_tested_at'),
        'last_test_result': row.get('last_test_result'),
        'created_at': row.get('created_at'),
        'updated_at': row.get('updated_at'),
    }


@router.post("/credentials")
async def create_credential(body: CredentialCreate, request: Request, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    # Verify student belongs to user's agency
    student = db.table("students").select("id, agency_id").eq("id", body.student_id).single().execute()
    if not student.data or student.data['agency_id'] != user.agency_id:
        raise HTTPException(404, "Student not found")

    credential_id = str(uuid.uuid4())
    payload = {
        "id": credential_id,
        "student_id": body.student_id,
        "agency_id": user.agency_id,
        "credential_type": body.credential_type,
        "label": body.label,
        "gmail_email": body.gmail_email,
        "gmail_password": encrypt(body.gmail_password),
        "has_common_app": body.has_common_app,
        "common_app_email": body.common_app_email if body.has_common_app else None,
        "common_app_password": encrypt(body.common_app_password) if (body.common_app_password and body.has_common_app) else None,
        "role": body.role,
        "notes": body.notes,
        "is_active": True,
    }

    result = db.table("student_credentials").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create credential")

    _log_access(db, user.agency_id, credential_id, user.id, "create", request)
    return _serialize(result.data[0])


@router.get("/credentials")
async def list_credentials(student_id: str, request: Request, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    result = db.table("student_credentials")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("agency_id", user.agency_id)\
        .eq("is_active", True)\
        .order("credential_type")\
        .execute()

    # Log a single 'read' entry for the whole list fetch
    for row in (result.data or []):
        _log_access(db, user.agency_id, row["id"], user.id, "read", request)

    return [_serialize(row) for row in (result.data or [])]


@router.patch("/credentials/{credential_id}")
async def update_credential(credential_id: str, body: CredentialUpdate, request: Request, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    existing = db.table("student_credentials").select("*").eq("id", credential_id).eq("agency_id", user.agency_id).single().execute()
    if not existing.data:
        raise HTTPException(404, "Credential not found")

    updates = {}
    if body.label is not None:
        updates['label'] = body.label
    if body.gmail_email is not None:
        updates['gmail_email'] = body.gmail_email
    if body.gmail_password is not None:
        updates['gmail_password'] = encrypt(body.gmail_password)
    if body.has_common_app is not None:
        updates['has_common_app'] = body.has_common_app
    if body.common_app_email is not None:
        updates['common_app_email'] = body.common_app_email
    if body.common_app_password is not None:
        updates['common_app_password'] = encrypt(body.common_app_password)
    if body.role is not None:
        updates['role'] = body.role
    if body.notes is not None:
        updates['notes'] = body.notes

    if not updates:
        return _serialize(existing.data)

    try:
        result = db.table("student_credentials")\
            .update(updates)\
            .eq("id", credential_id)\
            .eq("agency_id", user.agency_id)\
            .execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update credential: {exc}")

    if not result.data:
        raise HTTPException(status_code=404, detail="Credential not found or no changes applied")
    _log_access(db, user.agency_id, credential_id, user.id, "update", request)
    return _serialize(result.data[0])


@router.delete("/credentials/{credential_id}")
async def delete_credential(credential_id: str, request: Request, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    existing = db.table("student_credentials").select("id, agency_id").eq("id", credential_id).eq("agency_id", user.agency_id).single().execute()
    if not existing.data:
        raise HTTPException(404, "Credential not found")

    db.table("student_credentials").update({"is_active": False}).eq("id", credential_id).execute()
    _log_access(db, user.agency_id, credential_id, user.id, "delete", request)
    return {"success": True}


@router.post("/credentials/{credential_id}/test")
async def test_credential(credential_id: str, request: Request, user: AuthUser = Depends(get_current_user)):
    """
    Attempt a Gmail login to verify credentials.
    Returns: {status: 'success'|'failed'|'2fa_required', message: str}
    The actual Playwright login is handled by the gmail_agent.
    For now returns a placeholder — will be wired to gmail_agent in Phase 4C.
    """
    db = get_service_client()

    cred = db.table("student_credentials").select("*").eq("id", credential_id).eq("agency_id", user.agency_id).single().execute()
    if not cred.data:
        raise HTTPException(404, "Credential not found")

    # Placeholder until gmail_agent is wired in Phase 4C
    # Will call: result = await gmail_agent.test_login(gmail_email, gmail_password)
    result = {
        "status": "pending_agent",
        "message": "Gmail login agent not yet active. Credentials saved securely."
    }

    db.table("student_credentials").update({
        "last_tested_at": datetime.now(timezone.utc).isoformat(),
        "last_test_result": result["status"]
    }).eq("id", credential_id).execute()

    _log_access(db, user.agency_id, credential_id, user.id, "test", request)
    return result
