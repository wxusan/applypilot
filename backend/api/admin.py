"""
Admin API — agency owner operations only.
All endpoints require role == 'admin'.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional

from core.auth import get_current_user, require_admin
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Admin"], prefix="/admin")


class InviteStaffRequest(BaseModel):
    email: str
    full_name: str
    role: str = "staff"


class UpdateMemberRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/members")
async def list_members(user: AuthUser = Depends(require_admin)):
    db = get_service_client()

    result = db.table("agency_members").select(
        "id, role, is_active, joined_at, user:users(id, email, full_name, last_active_at)"
    ).eq("agency_id", user.agency_id).execute()

    return {"members": result.data}


@router.post("/members/invite", status_code=201)
async def invite_staff(
    data: InviteStaffRequest,
    request: Request,
    user: AuthUser = Depends(require_admin),
):
    """Invite a new staff member. Creates their auth account and agency membership."""
    db = get_service_client()
    from supabase import create_client
    from core.config import settings

    # Check member limit
    agency_result = db.table("agencies").select("max_staff").eq(
        "id", user.agency_id
    ).single().execute()
    agency = agency_result.data
    current_count = db.table("agency_members").select(
        "id", count="exact"
    ).eq("agency_id", user.agency_id).eq("is_active", True).execute()

    if current_count.count >= agency["max_staff"]:
        raise HTTPException(
            status_code=400,
            detail=f"Staff limit reached ({agency['max_staff']}). Upgrade your plan."
        )

    # Create Supabase auth user
    admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    auth_result = admin_client.auth.admin.create_user({
        "email": data.email,
        "email_confirm": True,
        "user_metadata": {"full_name": data.full_name},
    })

    if not auth_result.user:
        raise HTTPException(status_code=500, detail="Failed to create auth user")

    new_user_id = auth_result.user.id

    # Insert into users table
    db.table("users").insert({
        "id": new_user_id,
        "email": data.email,
        "full_name": data.full_name,
        "role": data.role,
    }).execute()

    # Link to agency
    db.table("agency_members").insert({
        "agency_id": user.agency_id,
        "user_id": new_user_id,
        "role": data.role,
        "is_active": True,
    }).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="member.invited",
        entity_type="user",
        entity_id=new_user_id,
        new_value={"email": data.email, "role": data.role},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Staff member invited", "user_id": new_user_id}


@router.patch("/members/{member_id}")
async def update_member(
    member_id: str,
    data: UpdateMemberRequest,
    request: Request,
    user: AuthUser = Depends(require_admin),
):
    db = get_service_client()

    existing = db.table("agency_members").select("id, role, user_id").eq(
        "id", member_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Member not found")

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    result = db.table("agency_members").update(payload).eq("id", member_id).eq(
        "agency_id", user.agency_id
    ).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="member.updated",
        entity_type="agency_member",
        entity_id=member_id,
        old_value=existing.data,
        new_value=payload,
        ip_address=request.client.host if request.client else None,
    )

    return result.data[0] if result.data else {}
