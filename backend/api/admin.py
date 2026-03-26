"""
Admin API — agency owner operations only.
All endpoints require role == 'admin'.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional

from core.auth import get_current_user, require_admin
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

logger = logging.getLogger(__name__)

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

    # Create Supabase auth user.
    # email_confirm=False keeps the account in "unconfirmed" state so that
    # generate_link(type="invite") works correctly — Supabase rejects the
    # invite type for already-confirmed users.
    admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    auth_result = admin_client.auth.admin.create_user({
        "email": data.email,
        "email_confirm": False,
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

    # Send invite email with a direct password-setup link.
    # We use hashed_token (not action_link) so the link lands on /reset-password
    # with ?token_hash=…&type=invite in the query params — no Supabase redirect
    # hop required, which avoids the "Link expired or invalid" race condition.
    invite_email_sent = False
    try:
        from core.email import send_email, invite_email_html

        agency_info = db.table("agencies").select("name, subscription_plan").eq(
            "id", user.agency_id
        ).single().execute()
        agency_name = agency_info.data.get("name", "your agency") if agency_info.data else "your agency"
        plan = agency_info.data.get("subscription_plan", "starter") if agency_info.data else "starter"

        link_res = admin_client.auth.admin.generate_link({
            "type": "invite",
            "email": data.email,
            "redirect_to": f"{settings.FRONTEND_URL}/reset-password",
        })
        hashed_token = link_res.properties.hashed_token
        activate_link = (
            f"{settings.FRONTEND_URL}/reset-password"
            f"?token_hash={hashed_token}&type=invite"
        )

        html = invite_email_html(
            owner_name=data.full_name,
            agency_name=agency_name,
            plan=plan,
            activate_link=activate_link,
        )
        invite_email_sent = send_email(
            to=data.email,
            subject="You've been invited to ApplyPilot — Set up your account",
            html=html,
            text=(
                f"Hi {data.full_name},\n\n"
                f"You've been invited to join {agency_name} on ApplyPilot.\n\n"
                f"Set your password and activate your account here:\n{activate_link}\n\n"
                f"This link expires in 24 hours.\n\nApplyPilot Team"
            ),
        )
    except Exception as email_ex:
        logger.warning(f"[admin.invite] Invite email failed for {data.email}: {email_ex}")

    return {"message": "Staff member invited", "user_id": new_user_id, "invite_email_sent": invite_email_sent}


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
