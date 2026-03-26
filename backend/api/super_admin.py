from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta, date

from core.auth import get_super_admin
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Super Admin"], prefix="/super-admin")


# ─────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────

class CreateAgencyRequest(BaseModel):
    name: str
    owner_email: str
    owner_name: Optional[str] = None
    subscription_plan: str = "starter"
    max_staff: int = 5
    max_students: int = 50
    ai_token_limit: int = 50000


class UpdatePlanConfigRequest(BaseModel):
    max_staff: int
    max_students: int
    ai_token_limit: int


class UpdateAgencyRequest(BaseModel):
    max_staff: Optional[int] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    ai_token_limit: Optional[int] = None


class BillingApproveRequest(BaseModel):
    action: str  # next_month | upgrade_plan | upgrade_staff | upgrade_students | unlock_feature | reset_tokens | add_tokens
    plan: Optional[str] = None
    max_staff: Optional[int] = None
    max_students: Optional[int] = None
    feature: Optional[str] = None
    note: Optional[str] = None
    token_amount: Optional[int] = None  # for add_tokens action


# ─────────────────────────────────────────────
# Stats
# ─────────────────────────────────────────────

@router.get("/stats")
async def get_global_stats(user: AuthUser = Depends(get_super_admin)):
    """Global system-wide metrics — parallel queries for speed."""
    import asyncio

    db = get_service_client()

    def _agencies():
        return db.table("agencies").select("id", count="exact").execute()

    def _students():
        return db.table("students").select("id", count="exact").execute()

    def _jobs():
        return db.table("agent_jobs").select("id", count="exact").execute()

    loop = asyncio.get_event_loop()
    agencies, students, jobs = await asyncio.gather(
        loop.run_in_executor(None, _agencies),
        loop.run_in_executor(None, _students),
        loop.run_in_executor(None, _jobs),
    )

    return {
        "total_agencies": agencies.count or 0,
        "total_students": students.count or 0,
        "total_ai_jobs": jobs.count or 0,
    }


@router.get("/stats/token-chart")
async def get_token_chart(user: AuthUser = Depends(get_super_admin)):
    """
    Real token burn chart — last 7 days aggregated across all agencies.
    Groups ai_usage_logs by day, summing tokens_spent and cost_usd.
    """
    db = get_service_client()
    today = date.today()
    seven_days_ago = (today - timedelta(days=6)).isoformat()

    result = db.table("ai_usage_logs").select(
        "tokens_spent, cost_usd, timestamp"
    ).gte("timestamp", seven_days_ago).order("timestamp").execute()

    # Aggregate by calendar day
    by_day: dict = {}
    for row in (result.data or []):
        ts = row.get("timestamp", "")
        day = ts[:10] if ts else None
        if not day:
            continue
        if day not in by_day:
            by_day[day] = {"tokens": 0, "cost": 0.0}
        by_day[day]["tokens"] += row.get("tokens_spent", 0) or 0
        by_day[day]["cost"] += float(row.get("cost_usd", 0) or 0)

    # Fill in all 7 days (even days with zero usage)
    chart = []
    for i in range(7):
        d = (today - timedelta(days=6 - i)).isoformat()
        day_label = (today - timedelta(days=6 - i)).strftime("%a")
        entry = by_day.get(d, {"tokens": 0, "cost": 0.0})
        chart.append({
            "name": day_label,
            "date": d,
            "tokens": entry["tokens"],
            "cost": round(entry["cost"], 4),
        })

    return {"chart": chart}


# ─────────────────────────────────────────────
# Agencies — CRUD
# ─────────────────────────────────────────────

@router.get("/agencies")
async def list_all_agencies(user: AuthUser = Depends(get_super_admin)):
    """Full list of all agencies with token usage and subscription status."""
    db = get_service_client()
    result = db.table("agencies").select(
        "id, name, slug, subscription_plan, subscription_status, subscription_expires_at, "
        "max_staff, ai_tokens_used, ai_token_limit, created_at"
    ).order("created_at", desc=True).execute()
    return {"agencies": result.data}


@router.post("/agencies", status_code=201)
async def create_agency(
    data: CreateAgencyRequest,
    user: AuthUser = Depends(get_super_admin),
):
    """
    Create a new agency and send an invite to the owner.
    1. Generate a URL-safe slug from the agency name.
    2. Insert the agency row.
    3. Send a Supabase magic link to the owner email.
    4. Create a placeholder user + agency_member row so the owner lands in the right agency on first login.
    """
    from supabase import create_client
    from core.config import settings
    import re
    import uuid

    db = get_service_client()
    admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    # Generate slug from name
    slug = re.sub(r"[^a-z0-9]+", "-", data.name.lower()).strip("-")
    # Ensure slug is unique
    existing = db.table("agencies").select("id").eq("slug", slug).execute()
    if existing.data:
        slug = f"{slug}-{str(uuid.uuid4())[:4]}"

    agency_id = str(uuid.uuid4())

    # Create agency
    agency_res = db.table("agencies").insert({
        "id": agency_id,
        "name": data.name,
        "slug": slug,
        "subscription_plan": data.subscription_plan,
        "subscription_status": "trial",
        "max_staff": data.max_staff,
        "ai_token_limit": data.ai_token_limit,
        "ai_tokens_used": 0,
    }).execute()

    if not agency_res.data:
        raise HTTPException(status_code=500, detail="Failed to create agency record")

    # Try to create/invite the owner via Supabase Auth
    owner_user_id = None
    invite_error = None
    user_is_new = False  # track whether we just created the user or they already existed
    try:
        # --- Attempt 1: create a brand-new auth user ---
        try:
            auth_res = admin_client.auth.admin.create_user({
                "email": data.owner_email,
                "email_confirm": False,
                "user_metadata": {"full_name": data.owner_name or ""},
            })
            if auth_res.user:
                owner_user_id = str(auth_res.user.id)
                user_is_new = True
                # Insert into users table
                db.table("users").upsert({
                    "id": owner_user_id,
                    "email": data.owner_email,
                    "full_name": data.owner_name or "",
                    "role": "admin",
                }).execute()
        except Exception:
            # --- Attempt 2: user already exists — look them up by email ---
            users_res = admin_client.auth.admin.list_users()
            existing = next(
                (u for u in users_res if u.email == data.owner_email),
                None
            )
            if existing:
                owner_user_id = str(existing.id)
                user_is_new = False
                # Ensure they exist in our users table.
                # IMPORTANT: never overwrite an existing role (e.g. super_admin).
                # Check first; only set role="admin" for brand-new profile rows.
                existing_profile = db.table("users").select("role").eq(
                    "id", owner_user_id
                ).maybe_single().execute()
                if existing_profile.data:
                    # Profile exists — update name/email only, preserve role
                    db.table("users").update({
                        "email": data.owner_email,
                        "full_name": data.owner_name or existing.user_metadata.get("full_name", ""),
                    }).eq("id", owner_user_id).execute()
                else:
                    # No profile yet — insert with admin role
                    db.table("users").insert({
                        "id": owner_user_id,
                        "email": data.owner_email,
                        "full_name": data.owner_name or existing.user_metadata.get("full_name", ""),
                        "role": "admin",
                    }).execute()

        if owner_user_id:
            # Link to agency (upsert in case they're already a member)
            db.table("agency_members").upsert({
                "agency_id": agency_id,
                "user_id": owner_user_id,
                "role": "admin",
                "is_active": True,
            }, on_conflict="agency_id,user_id").execute()

            # Generate an invite link that redirects to the set-password page.
            # - New users  → type "invite"   (sets password for the first time)
            # - Existing users → type "recovery" (password reset / re-access link)
            #   "invite" is rejected by Supabase when the user already has a confirmed account.
            try:
                from core.email import send_email, invite_email_html

                link_type = "invite" if user_is_new else "recovery"
                # Python SDK: redirect_to is top-level, NOT nested inside "options"
                link_res = admin_client.auth.admin.generate_link({
                    "type": link_type,
                    "email": data.owner_email,
                    "redirect_to": f"{settings.FRONTEND_URL}/reset-password",
                })
                # Use hashed_token to build a direct deep-link into the app.
                # This avoids the Supabase redirect hop that delivers the session
                # via the URL hash (#access_token=…), which the @supabase/ssr
                # browser client doesn't reliably auto-detect before the page's
                # verifyOtp check runs — causing the "Link expired or invalid" error.
                hashed_token = link_res.properties.hashed_token
                activate_link = (
                    f"{settings.FRONTEND_URL}/reset-password"
                    f"?token_hash={hashed_token}&type={link_type}"
                )

                html = invite_email_html(
                    owner_name=data.owner_name or "",
                    agency_name=data.name,
                    plan=data.subscription_plan,
                    activate_link=activate_link,
                )
                ok = send_email(
                    to=data.owner_email,
                    subject=f"You're invited to ApplyPilot — Set up your account",
                    html=html,
                    text=(
                        f"Hi {data.owner_name or 'there'},\n\n"
                        f"You've been added as owner of {data.name} on ApplyPilot ({data.subscription_plan.capitalize()} plan).\n\n"
                        f"Set your password and activate your account here:\n{activate_link}\n\n"
                        f"This link expires in 24 hours.\n\nApplyPilot Team"
                    ),
                )
                if not ok:
                    invite_error = "Email sending failed — check GMAIL_APP_PASSWORD in .env"
            except Exception as ex:
                invite_error = str(ex)

    except Exception as e:
        invite_error = str(e)

    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action="agency.created_by_super_admin",
        entity_type="agency",
        entity_id=agency_id,
        new_value={
            "name": data.name,
            "owner_email": data.owner_email,
            "plan": data.subscription_plan,
        },
    )

    return {
        "agency": agency_res.data[0],
        "owner_invited": owner_user_id is not None,
        "invite_error": invite_error,
    }


@router.get("/agencies/{agency_id}")
async def get_agency_detail(
    agency_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    """Full agency profile — counts, owner, full staff list, token usage, recent logs."""
    db = get_service_client()

    agency_res = db.table("agencies").select(
        "id, name, slug, subscription_plan, subscription_status, subscription_expires_at, "
        "max_staff, max_students, ai_tokens_used, ai_token_limit, created_at, unlocked_features"
    ).eq("id", agency_id).single().execute()

    if not agency_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    agency = agency_res.data

    # Student count
    students_res = db.table("students").select("id", count="exact").eq("agency_id", agency_id).execute()
    student_count = students_res.count or 0

    # Staff list (all active members)
    staff_res = db.table("agency_members").select(
        "id, role, is_active, joined_at, user:users(id, full_name, email, last_active_at)"
    ).eq("agency_id", agency_id).order("joined_at").execute()
    staff_list = []
    for s in (staff_res.data or []):
        u = s.get("user")
        if isinstance(u, list):
            u = u[0] if u else {}
        staff_list.append({
            "member_id": s["id"],
            "role": s["role"],
            "is_active": s["is_active"],
            "joined_at": s.get("joined_at"),
            "full_name": u.get("full_name") if u else None,
            "email": u.get("email") if u else None,
            "last_active_at": u.get("last_active_at") if u else None,
        })

    active_staff = [s for s in staff_list if s["is_active"]]
    owner = next((s for s in staff_list if s["role"] == "admin" and s["is_active"]), None)

    # Recent audit logs
    audit_res = db.table("audit_logs").select(
        "id, action, entity_type, created_at, user_id"
    ).eq("agency_id", agency_id).order("created_at", desc=True).limit(10).execute()

    return {
        "agency": agency,
        "student_count": student_count,
        "staff_count": len(active_staff),
        "staff_list": staff_list,
        "owner": owner,
        "recent_logs": audit_res.data or [],
    }


@router.patch("/agencies/{agency_id}")
async def update_agency(
    agency_id: str,
    data: UpdateAgencyRequest,
    user: AuthUser = Depends(get_super_admin),
):
    db = get_service_client()
    payload = {k: v for k, v in data.model_dump().items() if v is not None}

    if not payload:
        return {"message": "No fields to update"}

    # Capture old values for audit
    old_res = db.table("agencies").select(", ".join(payload.keys())).eq("id", agency_id).single().execute()
    old_value = old_res.data or {}

    result = db.table("agencies").update(payload).eq("id", agency_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action="agency.updated_by_super_admin",
        entity_type="agency",
        entity_id=agency_id,
        old_value=old_value,
        new_value=payload,
    )
    return result.data[0]


@router.delete("/agencies/{agency_id}", status_code=200)
async def delete_agency(
    agency_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    """
    Permanently delete an agency and all its associated data.
    Cascades are handled by the DB FK constraints.
    This is irreversible — the frontend must require name confirmation.
    """
    db = get_service_client()

    agency_res = db.table("agencies").select("id, name").eq("id", agency_id).single().execute()
    if not agency_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    agency_name = agency_res.data["name"]

    # Write the audit entry FIRST (while the agency still exists)
    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action="agency.deleted_by_super_admin",
        entity_type="agency",
        entity_id=agency_id,
        old_value={"name": agency_name},
    )

    # The audit_logs table FK on agency_id lacks ON DELETE SET NULL in the live DB,
    # so we NULL-out the reference manually before deleting the agency row.
    # This preserves the audit history while satisfying the FK constraint.
    db.table("audit_logs").update({"agency_id": None}).eq("agency_id", agency_id).execute()

    db.table("agencies").delete().eq("id", agency_id).execute()

    return {"message": f"Agency '{agency_name}' permanently deleted"}


@router.post("/agencies/{agency_id}/resend-invite")
async def resend_agency_invite(
    agency_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    """Re-send the Supabase invite email to the agency owner."""
    from supabase import create_client
    from core.config import settings

    db = get_service_client()

    # Find the owner (admin member)
    staff_res = db.table("agency_members").select(
        "user:users(email, full_name)"
    ).eq("agency_id", agency_id).eq("role", "admin").eq("is_active", True).limit(1).execute()

    if not staff_res.data:
        raise HTTPException(status_code=404, detail="No active admin found for this agency")

    owner_data = staff_res.data[0].get("user")
    if isinstance(owner_data, list):
        owner_data = owner_data[0] if owner_data else None

    if not owner_data or not owner_data.get("email"):
        raise HTTPException(status_code=404, detail="Owner email not found")

    owner_email = owner_data["email"]

    admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    try:
        from core.email import send_email, invite_email_html

        # Get agency name for the email
        agency_res = db.table("agencies").select("name, subscription_plan").eq("id", agency_id).single().execute()
        agency_name = agency_res.data.get("name", "your agency") if agency_res.data else "your agency"
        plan = agency_res.data.get("subscription_plan", "starter") if agency_res.data else "starter"

        # Detect whether the owner's email is already confirmed.
        # generate_link with type="invite" is rejected by Supabase for confirmed
        # users — use "recovery" instead so the link always works.
        all_users = admin_client.auth.admin.list_users()
        owner_auth = next((u for u in all_users if u.email == owner_email), None)
        resend_link_type = (
            "recovery"
            if (owner_auth and owner_auth.email_confirmed_at)
            else "invite"
        )

        # Python SDK: redirect_to is top-level, NOT nested inside "options"
        link_res = admin_client.auth.admin.generate_link({
            "type": resend_link_type,
            "email": owner_email,
            "redirect_to": f"{settings.FRONTEND_URL}/reset-password",
        })
        # Use hashed_token to build a direct deep-link (avoids the hash-redirect
        # race condition that causes "Link expired or invalid" in the browser).
        hashed_token = link_res.properties.hashed_token
        activate_link = (
            f"{settings.FRONTEND_URL}/reset-password"
            f"?token_hash={hashed_token}&type={resend_link_type}"
        )

        html = invite_email_html(
            owner_name=owner_data.get("full_name", ""),
            agency_name=agency_name,
            plan=plan,
            activate_link=activate_link,
        )
        ok = send_email(
            to=owner_email,
            subject="Your ApplyPilot invitation (resent) — Set up your account",
            html=html,
            text=(
                f"Hi,\n\nHere is your updated invitation link for {agency_name} on ApplyPilot.\n\n"
                f"Set your password here:\n{activate_link}\n\nThis link expires in 24 hours.\n\nApplyPilot Team"
            ),
        )
        if not ok:
            raise HTTPException(status_code=500, detail="Email sending failed — check GMAIL_APP_PASSWORD")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send invite: {str(e)}")

    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action="agency.invite_resent",
        entity_type="agency",
        entity_id=agency_id,
        new_value={"owner_email": owner_email},
    )

    return {"message": f"Invite resent to {owner_email}"}


# ─────────────────────────────────────────────
# Audit Log
# ─────────────────────────────────────────────

@router.get("/audit")
async def get_global_audit_logs(
    user: AuthUser = Depends(get_super_admin),
    agency_id: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    action_like: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
):
    """Paginated, filterable global audit log."""
    db = get_service_client()

    q = db.table("audit_logs").select(
        "id, action, entity_type, entity_id, old_value, new_value, created_at, agency_id, user_id",
        count="exact",
    ).order("created_at", desc=True)

    if agency_id:
        q = q.eq("agency_id", agency_id)
    if entity_type:
        q = q.eq("entity_type", entity_type)
    if action_like:
        q = q.like("action", f"%{action_like}%")
    if from_date:
        q = q.gte("created_at", from_date)

    q = q.range(offset, offset + limit - 1)
    result = q.execute()

    return {
        "logs": result.data or [],
        "total": result.count or 0,
        "offset": offset,
        "limit": limit,
    }


@router.post("/audit/{log_id}/revert")
async def revert_audit_log(
    log_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    """Revert a single audit log entry by applying old_value back to the DB row."""
    db = get_service_client()

    log_res = db.table("audit_logs").select("*").eq("id", log_id).single().execute()
    if not log_res.data:
        raise HTTPException(status_code=404, detail="Log not found")

    log = log_res.data

    if not log.get("old_value") or not log.get("entity_type") or not log.get("entity_id"):
        raise HTTPException(
            status_code=400,
            detail="This log entry has no old_value or entity reference and cannot be reverted."
        )

    db.table(log["entity_type"]).update(log["old_value"]).eq("id", log["entity_id"]).execute()

    await write_audit_log(
        agency_id=log.get("agency_id"),
        user_id=user.id,
        action=f"reverted.{log['action']}",
        entity_type=log["entity_type"],
        entity_id=log["entity_id"],
        old_value=log["new_value"],
        new_value=log["old_value"],
    )

    return {"message": "Action successfully reverted"}


# ─────────────────────────────────────────────
# Billing — Manual Approval
# ─────────────────────────────────────────────

@router.post("/agencies/{agency_id}/billing/approve")
async def approve_agency_billing(
    agency_id: str,
    data: BillingApproveRequest,
    user: AuthUser = Depends(get_super_admin),
):
    """Manually approve a billing action for an agency."""
    db = get_service_client()

    agency_res = db.table("agencies").select(
        "id, name, subscription_plan, max_staff, max_students, "
        "subscription_expires_at, unlocked_features, ai_tokens_used"
    ).eq("id", agency_id).single().execute()
    if not agency_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")
    agency = agency_res.data

    payload: dict = {}
    action_label = data.action

    if data.action == "next_month":
        current_expiry_str = agency.get("subscription_expires_at")
        if current_expiry_str:
            try:
                current_expiry = datetime.fromisoformat(current_expiry_str.replace("Z", "+00:00"))
                base = max(current_expiry, datetime.now(timezone.utc))
            except Exception:
                base = datetime.now(timezone.utc)
        else:
            base = datetime.now(timezone.utc)
        new_expiry = base + timedelta(days=30)
        payload["subscription_expires_at"] = new_expiry.isoformat()
        payload["subscription_status"] = "active"
        action_label = f"extended 30 days → {new_expiry.strftime('%Y-%m-%d')}"

    elif data.action == "upgrade_plan":
        if not data.plan:
            raise HTTPException(status_code=400, detail="plan is required for upgrade_plan")
        payload["subscription_plan"] = data.plan
        action_label = f"plan changed to {data.plan}"

    elif data.action == "upgrade_staff":
        if data.max_staff is None:
            raise HTTPException(status_code=400, detail="max_staff is required for upgrade_staff")
        payload["max_staff"] = data.max_staff
        action_label = f"max_staff set to {data.max_staff}"

    elif data.action == "upgrade_students":
        if data.max_students is None:
            raise HTTPException(status_code=400, detail="max_students is required for upgrade_students")
        payload["max_students"] = data.max_students
        action_label = f"max_students set to {data.max_students}"

    elif data.action == "unlock_feature":
        if not data.feature:
            raise HTTPException(status_code=400, detail="feature is required for unlock_feature")
        current_features: List[str] = agency.get("unlocked_features") or []
        if data.feature not in current_features:
            current_features.append(data.feature)
        payload["unlocked_features"] = current_features
        action_label = f"unlocked feature: {data.feature}"

    elif data.action == "reset_tokens":
        payload["ai_tokens_used"] = 0
        action_label = f"AI tokens reset (was {agency.get('ai_tokens_used', 0):,})"

    elif data.action == "add_tokens":
        if data.token_amount is None or data.token_amount <= 0:
            raise HTTPException(status_code=400, detail="token_amount must be a positive integer for add_tokens")
        # Fetch current ai_token_limit
        agency_limit_res = db.table("agencies").select("ai_token_limit").eq("id", agency_id).single().execute()
        current_limit = (agency_limit_res.data or {}).get("ai_token_limit") or 0
        new_limit = current_limit + data.token_amount
        payload["ai_token_limit"] = new_limit
        action_label = f"Added {data.token_amount:,} tokens → new limit {new_limit:,}"

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {data.action}")

    if payload:
        result = db.table("agencies").update(payload).eq("id", agency_id).execute()
        updated = result.data[0] if result.data else agency
    else:
        updated = agency

    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action=f"billing.manual_approval.{data.action}",
        entity_type="agency",
        entity_id=agency_id,
        old_value={k: agency.get(k) for k in payload},
        new_value={**payload, "note": data.note},
    )

    try:
        from services.telegram_bot import send_alert_to_staff
        note_line = f"\n📝 Note: {data.note}" if data.note else ""
        await send_alert_to_staff(
            agency_id=agency_id,
            message=(
                f"✅ *Billing Updated*\n"
                f"Your subscription has been updated by the platform admin.\n"
                f"Action: {action_label}{note_line}"
            ),
        )
    except Exception:
        pass

    return {"agency": updated, "action": action_label}


@router.get("/agencies/{agency_id}/billing/history")
async def get_agency_billing_history(
    agency_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    db = get_service_client()
    result = db.table("audit_logs").select(
        "id, action, old_value, new_value, created_at, user_id"
    ).eq("agency_id", agency_id).like("action", "billing.%").order(
        "created_at", desc=True
    ).limit(50).execute()
    return {"history": result.data or []}


# ─────────────────────────────────────────────
# Scheduler Control
# ─────────────────────────────────────────────

JOB_META = {
    "morning_briefing":       {"label": "Morning Briefing",        "desc": "Telegram briefing for all agencies",       "schedule": "Daily 8:00 AM UZT"},
    "evening_summary":        {"label": "Evening Summary",          "desc": "End-of-day summary via Telegram",          "schedule": "Daily 9:00 PM UZT"},
    "deadline_tracker_morning": {"label": "Deadline Tracker (AM)", "desc": "Check upcoming deadlines, alert staff",   "schedule": "Daily 7:00 AM UZT"},
    "deadline_tracker_noon":   {"label": "Deadline Tracker (Noon)","desc": "Emergency deadline alerts",                "schedule": "Daily 12:00 PM UZT"},
    "deadline_tracker_evening":{"label": "Deadline Tracker (PM)", "desc": "Emergency deadline alerts",                "schedule": "Daily 6:00 PM UZT"},
    "email_sync":              {"label": "Email Sync",              "desc": "Sync all agency email accounts",           "schedule": "Every hour"},
}


@router.get("/scheduler")
async def get_scheduler_jobs(user: AuthUser = Depends(get_super_admin)):
    """List all cron jobs with their next scheduled run time."""
    from services.scheduler import get_scheduler

    scheduler = get_scheduler()
    jobs = []

    for job_id, meta in JOB_META.items():
        if scheduler:
            job = scheduler.get_job(job_id)
            next_run = job.next_run_time.isoformat() if (job and job.next_run_time) else None
            running = scheduler.running
        else:
            next_run = None
            running = False

        jobs.append({
            "id": job_id,
            "name": meta["label"],        # frontend expects "name"
            "label": meta["label"],       # keep for backwards compat
            "desc": meta["desc"],
            "trigger": meta["schedule"],  # frontend expects "trigger"
            "schedule": meta["schedule"], # keep for backwards compat
            "next_run_time": next_run,    # frontend expects "next_run_time"
            "next_run": next_run,         # keep for backwards compat
            "scheduler_running": running,
        })

    return {"jobs": jobs}


@router.post("/scheduler/{job_id}/run")
async def run_scheduler_job(
    job_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    """Manually trigger a cron job immediately (fire-and-forget)."""
    import asyncio
    from services.scheduler import get_job_func

    if job_id not in JOB_META:
        raise HTTPException(status_code=404, detail=f"Unknown job: {job_id}")

    func = get_job_func(job_id)
    if func is None:
        raise HTTPException(status_code=503, detail="Scheduler not running")

    asyncio.create_task(func())

    await write_audit_log(
        agency_id=None,
        user_id=user.id,
        action=f"scheduler.manual_run.{job_id}",
        entity_type="scheduler",
        entity_id=job_id,
        new_value={"triggered_by": user.email},
    )

    return {"message": f"Job '{JOB_META[job_id]['label']}' triggered successfully"}


# ─────────────────────────────────────────────
# Plan Configuration
# ─────────────────────────────────────────────

VALID_PLANS = {"starter", "pro", "enterprise"}

@router.get("/plans")
async def get_plan_configs(user: AuthUser = Depends(get_super_admin)):
    """Get default limits for all subscription plans."""
    db = get_service_client()
    configs: dict = {}
    try:
        result = db.table("plan_configs").select("*").execute()
        configs = {row["plan"]: row for row in (result.data or [])}
    except Exception as e:
        # If the plan_configs table doesn't exist yet (migration not run),
        # return safe defaults so the page still loads.
        import logging
        logging.getLogger(__name__).warning(f"plan_configs query failed: {e}")

    # Ensure all 3 plans are always represented
    for plan in VALID_PLANS:
        if plan not in configs:
            configs[plan] = {"plan": plan, "max_staff": 0, "max_students": 0, "ai_token_limit": 0}
    return {"plans": configs}


@router.patch("/plans/{plan}")
async def update_plan_config(
    plan: str,
    data: UpdatePlanConfigRequest,
    user: AuthUser = Depends(get_super_admin),
):
    """Update the default limits for a subscription plan."""
    if plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {', '.join(VALID_PLANS)}")

    db = get_service_client()
    db.table("plan_configs").upsert({
        "plan": plan,
        "max_staff": data.max_staff,
        "max_students": data.max_students,
        "ai_token_limit": data.ai_token_limit,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    await write_audit_log(
        agency_id=None,
        user_id=user.id,
        action=f"plan_config.updated.{plan}",
        entity_type="agency",
        entity_id=plan,
        new_value={"max_staff": data.max_staff, "max_students": data.max_students, "ai_token_limit": data.ai_token_limit},
    )

    return {"message": f"Plan '{plan}' updated successfully"}
