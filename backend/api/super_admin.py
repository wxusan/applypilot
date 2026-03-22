from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
import re

from core.auth import get_super_admin
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Super Admin"], prefix="/super-admin")


class UpdateAgencyRequest(BaseModel):
    max_staff: Optional[int] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None


class CreateAgencyRequest(BaseModel):
    name: str
    slug: str
    admin_email: EmailStr
    subscription_plan: str = "starter"
    max_staff: int = 5
    ai_token_limit: int = 500000


@router.get("/stats")
async def get_global_stats(user: AuthUser = Depends(get_super_admin)):
    """Global system-wide metrics for the platform owner."""
    db = get_service_client()

    agencies = db.table("agencies").select("id", count="exact").execute()
    students = db.table("students").select("id", count="exact").execute()
    jobs = db.table("agent_jobs").select("id", count="exact").execute()

    return {
        "total_agencies": agencies.count or 0,
        "total_students": students.count or 0,
        "total_ai_jobs": jobs.count or 0,
    }


@router.get("/agencies")
async def list_all_agencies(user: AuthUser = Depends(get_super_admin)):
    db = get_service_client()
    result = db.table("agencies").select(
        "id, name, slug, subscription_plan, max_staff, ai_tokens_used, ai_token_limit, created_at"
    ).order("created_at", desc=True).execute()
    return {"agencies": result.data}


@router.patch("/agencies/{agency_id}")
async def update_agency(
    agency_id: str,
    data: UpdateAgencyRequest,
    user: AuthUser = Depends(get_super_admin)
):
    db = get_service_client()
    payload = {k: v for k, v in data.model_dump().items() if v is not None}

    if not payload:
        return {"message": "No fields to update"}

    result = db.table("agencies").update(payload).eq("id", agency_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action="agency.updated_by_super_admin",
        entity_type="agency",
        entity_id=agency_id,
        new_value=payload,
    )
    return result.data[0]


@router.get("/billing")
async def get_global_billing(user: AuthUser = Depends(get_super_admin)):
    """Per-agency AI token consumption and cost overview for the platform owner."""
    db = get_service_client()

    agencies_res = db.table("agencies").select(
        "id, name, slug, subscription_plan, ai_tokens_used, ai_token_limit"
    ).order("ai_tokens_used", desc=True).execute()

    logs_res = db.table("ai_usage_logs").select(
        "agency_id, tokens_spent, cost_usd, agent_type, timestamp"
    ).order("timestamp", desc=True).limit(500).execute()

    logs = logs_res.data or []
    total_tokens = sum(r["tokens_spent"] for r in logs)
    total_cost   = round(sum(float(r["cost_usd"]) for r in logs), 4)

    agency_costs: dict = {}
    for r in logs:
        aid = r["agency_id"]
        agency_costs.setdefault(aid, {"tokens": 0, "cost": 0.0})
        agency_costs[aid]["tokens"] += r["tokens_spent"]
        agency_costs[aid]["cost"]   += float(r["cost_usd"])

    enriched = []
    for ag in agencies_res.data or []:
        ac = agency_costs.get(ag["id"], {"tokens": 0, "cost": 0.0})
        enriched.append({
            **ag,
            "ledger_tokens": ac["tokens"],
            "ledger_cost_usd": round(ac["cost"], 4),
            "utilisation_pct": round(
                min(ag["ai_tokens_used"] / max(ag["ai_token_limit"], 1) * 100, 100), 1
            ) if ag.get("ai_tokens_used") and ag.get("ai_token_limit") else 0.0,
        })

    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    daily: dict = {}
    for i in range(7):
        day = (now - timedelta(days=6 - i)).strftime("%a")
        daily[day] = {"tokens": 0, "cost": 0.0}
    for r in logs:
        ts = r["timestamp"]
        if isinstance(ts, str):
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                continue
        else:
            dt = ts
        if (now - dt).days <= 6:
            day_key = dt.strftime("%a")
            if day_key in daily:
                daily[day_key]["tokens"] += r["tokens_spent"]
                daily[day_key]["cost"]   += float(r["cost_usd"])

    burn_chart = [
        {"name": k, "tokens": v["tokens"], "cost": round(v["cost"], 4)}
        for k, v in daily.items()
    ]

    return {
        "total_tokens_platform": total_tokens,
        "total_cost_usd_platform": total_cost,
        "agencies": enriched,
        "burn_chart": burn_chart,
    }


@router.post("/agencies")
async def create_agency(
    data: CreateAgencyRequest,
    user: AuthUser = Depends(get_super_admin),
):
    """Create a new agency and its admin user account."""
    db = get_service_client()

    # Validate slug format
    if not re.match(r'^[a-z0-9-]+$', data.slug):
        raise HTTPException(status_code=400, detail="Slug must be lowercase letters, numbers and hyphens only")

    # Check slug uniqueness
    existing = db.table("agencies").select("id").eq("slug", data.slug).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail=f"Slug '{data.slug}' is already taken")

    # Create agency row
    agency_res = db.table("agencies").insert({
        "name": data.name,
        "slug": data.slug,
        "subscription_plan": data.subscription_plan,
        "max_staff": data.max_staff,
        "ai_token_limit": data.ai_token_limit,
        "ai_tokens_used": 0,
    }).execute()

    if not agency_res.data:
        raise HTTPException(status_code=500, detail="Failed to create agency")

    agency = agency_res.data[0]
    agency_id = agency["id"]

    # Create the admin user via Supabase Auth (invite flow)
    try:
        from core.config import settings
        import httpx

        async with httpx.AsyncClient() as client:
            invite_res = await client.post(
                f"{settings.SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": settings.SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "email": data.admin_email,
                    "email_confirm": True,
                    "password": f"ApplyPilot_{data.slug}_2024!",
                    "user_metadata": {"full_name": f"{data.name} Admin"},
                },
            )

        if invite_res.status_code not in (200, 201):
            await write_audit_log(
                agency_id=agency_id,
                user_id=user.id,
                action="agency.created_user_invite_failed",
                entity_type="agency",
                entity_id=agency_id,
                new_value={"slug": data.slug, "admin_email": data.admin_email, "error": invite_res.text},
            )
            return {
                "agency": agency,
                "warning": f"Agency created but admin user invite failed: {invite_res.text}. Create user manually in Supabase.",
            }

        auth_user = invite_res.json()
        auth_user_id = auth_user["id"]

        # Insert into users table
        db.table("users").insert({
            "id": auth_user_id,
            "email": data.admin_email,
            "full_name": f"{data.name} Admin",
            "role": "admin",
        }).execute()

        # Link to agency as admin
        db.table("agency_members").insert({
            "user_id": auth_user_id,
            "agency_id": agency_id,
            "role": "admin",
            "is_active": True,
        }).execute()

    except Exception as exc:
        await write_audit_log(
            agency_id=agency_id,
            user_id=user.id,
            action="agency.created_user_setup_error",
            entity_type="agency",
            entity_id=agency_id,
            new_value={"error": str(exc)},
        )
        return {
            "agency": agency,
            "warning": f"Agency created but user setup failed: {exc}. Set up admin user manually.",
        }

    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action="agency.created",
        entity_type="agency",
        entity_id=agency_id,
        new_value={"name": data.name, "slug": data.slug, "admin_email": data.admin_email},
    )

    return {
        "agency": agency,
        "admin_email": data.admin_email,
        "temp_password": f"ApplyPilot_{data.slug}_2024!",
        "message": "Agency created. Admin should change password on first login.",
    }


@router.post("/agencies/{agency_id}/reset-tokens")
async def reset_agency_tokens(
    agency_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    """Manually reset an agency's monthly token counter to 0."""
    db = get_service_client()

    agency_res = db.table("agencies").select("id, name, ai_tokens_used").eq("id", agency_id).single().execute()
    if not agency_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    agency = agency_res.data
    prev_usage = agency.get("ai_tokens_used", 0)

    db.table("agencies").update({"ai_tokens_used": 0}).eq("id", agency_id).execute()

    await write_audit_log(
        agency_id=agency_id,
        user_id=user.id,
        action="billing.manual_token_reset",
        entity_type="agency",
        entity_id=agency_id,
        old_value={"ai_tokens_used": prev_usage},
        new_value={"ai_tokens_used": 0},
    )

    try:
        from services.telegram_bot import send_alert_to_staff
        await send_alert_to_staff(
            agency_id=agency_id,
            message=(
                f"✅ *Token Counter Reset*\n"
                f"Your agency's AI token usage has been reset from {prev_usage:,} → 0 by the platform admin.\n"
                f"Your AI features are now fully available again."
            ),
        )
    except Exception:
        pass

    return {
        "message": f"Token counter reset for {agency['name']}",
        "previous_usage": prev_usage,
        "new_usage": 0,
    }


@router.get("/audit")
async def get_global_audit_logs(user: AuthUser = Depends(get_super_admin)):
    db = get_service_client()
    result = db.table("audit_logs").select(
        "id, action, entity_type, entity_id, old_value, new_value, created_at, agency_id, user_id"
    ).order("created_at", desc=True).limit(200).execute()
    return {"logs": result.data}


@router.post("/audit/{log_id}/revert")
async def revert_audit_log(
    log_id: str,
    user: AuthUser = Depends(get_super_admin)
):
    """Dynamically applies the old_value from an audit log to revert an action."""
    db = get_service_client()

    log_res = db.table("audit_logs").select("*").eq("id", log_id).single().execute()
    if not log_res.data:
        raise HTTPException(status_code=404, detail="Log not found")

    log = log_res.data

    if not log.get("old_value") or not log.get("entity_type") or not log.get("entity_id"):
        raise HTTPException(
            status_code=400,
            detail="This action fundamentally lacks an old_value state or entity ID and cannot be mathematically reverted."
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
