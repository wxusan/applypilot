from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from core.auth import get_super_admin
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Super Admin"], prefix="/super-admin")


class UpdateAgencyRequest(BaseModel):
    max_staff: Optional[int] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None


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
        "id, name, slug, subscription_plan, max_staff, created_at"
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

    # Revert the database row
    db.table(log["entity_type"]).update(log["old_value"]).eq("id", log["entity_id"]).execute()

    # Log the reversion
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


# ────────────────────────────────────────────────────────────
# Manual Billing Approval
# ────────────────────────────────────────────────────────────

class BillingApproveRequest(BaseModel):
    action: str  # next_month | upgrade_plan | upgrade_staff | upgrade_students | unlock_feature
    plan: Optional[str] = None
    max_staff: Optional[int] = None
    max_students: Optional[int] = None
    feature: Optional[str] = None
    note: Optional[str] = None


@router.post("/agencies/{agency_id}/billing/approve")
async def approve_agency_billing(
    agency_id: str,
    data: BillingApproveRequest,
    user: AuthUser = Depends(get_super_admin),
):
    """Manually approve a billing action for an agency (no Stripe)."""
    db = get_service_client()

    # Load current agency
    agency_res = db.table("agencies").select(
        "id, name, subscription_plan, max_staff, max_students, subscription_expires_at, unlocked_features"
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

    # Notify agency via Telegram
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
    """Returns billing-related audit log entries for a specific agency."""
    db = get_service_client()

    result = db.table("audit_logs").select(
        "id, action, old_value, new_value, created_at, user_id"
    ).eq("agency_id", agency_id).like("action", "billing.%").order(
        "created_at", desc=True
    ).limit(50).execute()

    return {"history": result.data or []}
