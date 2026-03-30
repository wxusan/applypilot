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

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser
from services.credential_vault import encrypt, decrypt

router = APIRouter(tags=["Credentials"])


class CredentialCreate(BaseModel):
    student_id: str
    credential_type: str  # 'student' | 'teacher' | 'counsellor'
    label: str  # e.g. "Mr. Johnson (Physics Teacher)"
    gmail_email: str
    gmail_password: str
    common_app_email: Optional[str] = None
    common_app_password: Optional[str] = None
    notes: Optional[str] = None


class CredentialUpdate(BaseModel):
    label: Optional[str] = None
    gmail_email: Optional[str] = None
    gmail_password: Optional[str] = None
    common_app_email: Optional[str] = None
    common_app_password: Optional[str] = None
    notes: Optional[str] = None


def _mask(value: Optional[str]) -> Optional[str]:
    """Return masked password for display."""
    if not value:
        return None
    return '••••••••'


def _serialize(row: dict, show_masked: bool = True) -> dict:
    """Serialize a credential row, masking passwords."""
    return {
        'id': row.get('id'),
        'student_id': row.get('student_id'),
        'credential_type': row.get('credential_type'),
        'label': row.get('label'),
        'gmail_email': row.get('gmail_email'),
        'gmail_password': _mask(row.get('gmail_password')) if show_masked else decrypt(row.get('gmail_password', '')),
        'common_app_email': row.get('common_app_email'),
        'common_app_password': _mask(row.get('common_app_password')) if show_masked else decrypt(row.get('common_app_password', '')),
        'notes': row.get('notes'),
        'is_active': row.get('is_active'),
        'last_tested_at': row.get('last_tested_at'),
        'last_test_result': row.get('last_test_result'),
        'created_at': row.get('created_at'),
        'updated_at': row.get('updated_at'),
    }


@router.post("/credentials")
async def create_credential(body: CredentialCreate, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    # Verify student belongs to user's agency
    student = db.table("students").select("id, agency_id").eq("id", body.student_id).single().execute()
    if not student.data or student.data['agency_id'] != user.agency_id:
        raise HTTPException(404, "Student not found")

    payload = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "agency_id": user.agency_id,
        "credential_type": body.credential_type,
        "label": body.label,
        "gmail_email": body.gmail_email,
        "gmail_password": encrypt(body.gmail_password),
        "common_app_email": body.common_app_email,
        "common_app_password": encrypt(body.common_app_password) if body.common_app_password else None,
        "notes": body.notes,
        "is_active": True,
    }

    result = db.table("student_credentials").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create credential")

    return _serialize(result.data[0])


@router.get("/credentials")
async def list_credentials(student_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    result = db.table("student_credentials")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("agency_id", user.agency_id)\
        .eq("is_active", True)\
        .order("credential_type")\
        .execute()

    return [_serialize(row) for row in (result.data or [])]


@router.patch("/credentials/{credential_id}")
async def update_credential(credential_id: str, body: CredentialUpdate, user: AuthUser = Depends(get_current_user)):
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
    if body.common_app_email is not None:
        updates['common_app_email'] = body.common_app_email
    if body.common_app_password is not None:
        updates['common_app_password'] = encrypt(body.common_app_password)
    if body.notes is not None:
        updates['notes'] = body.notes

    if not updates:
        return _serialize(existing.data)

    result = db.table("student_credentials").update(updates).eq("id", credential_id).execute()
    return _serialize(result.data[0])


@router.delete("/credentials/{credential_id}")
async def delete_credential(credential_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    existing = db.table("student_credentials").select("id, agency_id").eq("id", credential_id).eq("agency_id", user.agency_id).single().execute()
    if not existing.data:
        raise HTTPException(404, "Credential not found")

    db.table("student_credentials").update({"is_active": False}).eq("id", credential_id).execute()
    return {"success": True}


@router.post("/credentials/{credential_id}/test")
async def test_credential(credential_id: str, user: AuthUser = Depends(get_current_user)):
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
        "last_tested_at": "now()",
        "last_test_result": result["status"]
    }).eq("id", credential_id).execute()

    return result
