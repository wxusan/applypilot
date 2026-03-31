"""
Staff management API.
- Invite staff via Supabase Auth email invite
- Deactivate / reactivate members
- Max staff enforced from agencies.max_staff
All actions require admin role. agency_id always from JWT.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user, require_admin
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Staff"])


class InviteRequest(BaseModel):
    email: EmailStr
    role: Optional[str] = "staff"


@router.post("/staff/invite")
async def invite_staff(
    data: InviteRequest,
    request: Request,
    user: AuthUser = Depends(require_admin),
):
    """
    Send a Supabase Auth email invite to a new staff member.
    Enforces max_staff limit before sending.
    """
    db = get_service_client()

    # Get agency max_staff
    agency_res = db.table("agencies").select("max_staff, name").eq("id", user.agency_id).single().execute()
    if not agency_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    max_staff = agency_res.data.get("max_staff") or 2
    agency_name = agency_res.data.get("name", "your agency")

    # Count active members
    active_res = db.table("agency_members").select("id", count="exact").eq(
        "agency_id", user.agency_id
    ).eq("is_active", True).execute()

    active_count = active_res.count or 0
    if active_count >= max_staff:
        raise HTTPException(
            status_code=400,
            detail=f"Staff limit reached ({max_staff}). Deactivate a member before inviting new ones.",
        )

    # Check not already a member
    existing = db.table("users").select("id").eq("email", str(data.email)).execute()
    if existing.data:
        existing_uid = existing.data[0]["id"]
        already = db.table("agency_members").select("id, is_active").eq(
            "agency_id", user.agency_id
        ).eq("user_id", existing_uid).execute()
        if already.data:
            if already.data[0]["is_active"]:
                raise HTTPException(status_code=409, detail="This person is already an active staff member.")
            else:
                raise HTTPException(
                    status_code=409,
                    detail="This person is a deactivated member. Use reactivate instead.",
                )

    # Send Supabase Auth invite email
    # The invite creates a Supabase user and sends a magic-link email.
    # We use the service-role client's admin API.
    from core.config import settings as app_settings
    from supabase import create_client, Client

    admin_client: Client = create_client(
        app_settings.SUPABASE_URL,
        app_settings.SUPABASE_SERVICE_KEY,
    )

    try:
        invite_res = admin_client.auth.admin.invite_user_by_email(
            str(data.email),
            options={
                "data": {
                    "agency_id": user.agency_id,
                    "role": data.role,
                    "invited_by": user.id,
                },
                "redirect_to": f"{app_settings.FRONTEND_URL}/auth/accept-invite",
            },
        )
    except Exception as exc:
        logger.error(f"Supabase invite error: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to send invitation: {exc}")

    invited_user_id = invite_res.user.id if invite_res.user else None

    # Pre-create agency_members row (pending) so it appears in the list immediately
    if invited_user_id:
        # Upsert user row
        db.table("users").upsert({
            "id": invited_user_id,
            "email": str(data.email),
            "full_name": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }, on_conflict="id").execute()

        db.table("agency_members").insert({
            "agency_id": user.agency_id,
            "user_id": invited_user_id,
            "role": data.role,
            "is_active": True,
            "joined_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="staff.invited",
        entity_type="agency_member",
        entity_id=str(invited_user_id or data.email),
        new_value={"email": str(data.email), "role": data.role},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": f"Invitation sent to {data.email}. They'll receive a login link by email."}


@router.post("/staff/{member_id}/deactivate")
async def deactivate_staff(
    member_id: str,
    request: Request,
    user: AuthUser = Depends(require_admin),
):
    """Set agency_members.is_active = False. Prevents login but preserves data."""
    db = get_service_client()

    # Confirm member belongs to this agency
    member = db.table("agency_members").select("id, user_id, role").eq(
        "id", member_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not member.data:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if member.data["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot deactivate admin accounts")

    if member.data["user_id"] == user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    db.table("agency_members").update({
        "is_active": False,
    }).eq("id", member_id).execute()

    # Revoke all active Supabase Auth sessions for this user immediately.
    # This prevents a deactivated staff member who is already logged in from
    # continuing to use the app until their JWT naturally expires.
    try:
        from core.config import settings as app_settings
        from supabase import create_client
        admin_client = create_client(app_settings.SUPABASE_URL, app_settings.SUPABASE_SERVICE_KEY)
        admin_client.auth.admin.sign_out(member.data["user_id"])
    except Exception as revoke_err:
        logger.warning(f"Session revocation failed for {member.data['user_id']}: {revoke_err}")

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="staff.deactivated",
        entity_type="agency_member",
        entity_id=member_id,
        new_value={"is_active": False},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Staff member deactivated."}


@router.post("/staff/{member_id}/reactivate")
async def reactivate_staff(
    member_id: str,
    request: Request,
    user: AuthUser = Depends(require_admin),
):
    """Set agency_members.is_active = True — checks max_staff first."""
    db = get_service_client()

    member = db.table("agency_members").select("id, user_id, role").eq(
        "id", member_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not member.data:
        raise HTTPException(status_code=404, detail="Staff member not found")

    # Enforce max_staff
    agency_res = db.table("agencies").select("max_staff").eq("id", user.agency_id).single().execute()
    max_staff = agency_res.data.get("max_staff", 2) if agency_res.data else 2

    active_res = db.table("agency_members").select("id", count="exact").eq(
        "agency_id", user.agency_id
    ).eq("is_active", True).execute()

    if (active_res.count or 0) >= max_staff:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reactivate — staff limit of {max_staff} already reached.",
        )

    db.table("agency_members").update({
        "is_active": True,
    }).eq("id", member_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="staff.reactivated",
        entity_type="agency_member",
        entity_id=member_id,
        new_value={"is_active": True},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Staff member reactivated."}
