from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

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
