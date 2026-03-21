from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from core.encryption import encrypt
from models.user import AuthUser

router = APIRouter(tags=["Emails"])


class EmailAccountCreate(BaseModel):
    student_id: str
    email_address: str
    provider: str  # gmail | outlook | yahoo
    imap_host: str
    imap_port: int
    password: str  # Plaintext; encrypted before storage


@router.get("/emails")
async def list_emails(
    student_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = db.table("emails").select(
        "id, student_id, direction, from_address, to_address, subject, "
        "received_at, category, university_name, importance, is_read, "
        "draft_status, created_at",
        count="exact",
    ).eq("agency_id", user.agency_id)  # ISOLATION

    if student_id:
        query = query.eq("student_id", student_id)
    if category:
        query = query.eq("category", category)
    if unread_only:
        query = query.eq("is_read", False)

    result = query.order("received_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"emails": result.data, "total": result.count}


@router.get("/emails/{email_id}")
async def get_email(
    email_id: str,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    result = db.table("emails").select("*").eq("id", email_id).eq(
        "agency_id", user.agency_id
    ).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Email not found")

    # Mark as read
    db.table("emails").update({"is_read": True}).eq("id", email_id).execute()

    return result.data


@router.post("/email-accounts", status_code=201)
async def add_email_account(
    data: EmailAccountCreate,
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

    result = db.table("email_accounts").insert({
        "agency_id": user.agency_id,
        "student_id": data.student_id,
        "email_address": data.email_address,
        "provider": data.provider,
        "imap_host": data.imap_host,
        "imap_port": data.imap_port,
        "password_encrypted": encrypt(data.password),  # Never stored in plaintext
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save email account")

    account = result.data[0]

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=data.student_id,
        action="email_account.added",
        entity_type="email_account",
        entity_id=account["id"],
        new_value={"email_address": data.email_address},
        ip_address=request.client.host if request.client else None,
    )

    # Mask the password before returning
    account.pop("password_encrypted", None)
    return account


@router.post("/emails/{email_id}/approve-draft")
async def approve_email_draft(
    email_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """Approve an AI-drafted reply. Marks it ready to send (does NOT auto-send)."""
    db = get_service_client()

    result = db.table("emails").update({
        "draft_status": "approved",
        "approved_by": user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", email_id).eq("agency_id", user.agency_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Email not found")

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="email.draft_approved",
        entity_type="email",
        entity_id=email_id,
        ip_address=request.client.host if request.client else None,
    )

    return result.data[0]
