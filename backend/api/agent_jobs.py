from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Agent Jobs"])


class RejectRequest(BaseModel):
    reason: str


@router.get("/agent-jobs")
async def list_agent_jobs(
    status: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = db.table("agent_jobs").select(
        "id, agent_type, job_type, status, approval_message, screenshot_urls, "
        "created_at, completed_at, duration_seconds, error_message, "
        "student:students(id, full_name)",
        count="exact",
    ).eq("agency_id", user.agency_id)  # ISOLATION

    if status:
        query = query.eq("status", status)
    if student_id:
        query = query.eq("student_id", student_id)

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"jobs": result.data, "total": result.count}


@router.get("/agent-jobs/{job_id}")
async def get_agent_job(
    job_id: str,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    result = db.table("agent_jobs").select("*").eq("id", job_id).eq(
        "agency_id", user.agency_id
    ).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    return result.data


@router.post("/agent-jobs/{job_id}/approve")
async def approve_job(
    job_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = db.table("agent_jobs").select("id, agent_type, job_type, status").eq(
        "id", job_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")

    if existing.data["status"] != "awaiting_approval":
        raise HTTPException(status_code=400, detail="Job is not awaiting approval")

    result = db.table("agent_jobs").update({
        "status": "approved",
        "approved_by": user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).eq("agency_id", user.agency_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="agent_job.approved",
        entity_type="agent_job",
        entity_id=job_id,
        ip_address=request.client.host if request.client else None,
    )

    # If this is a browser agent job, signal continuation
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to approve job")
    job_data = result.data[0]
    if existing.data["agent_type"] == "browser":
        import asyncio
        asyncio.create_task(_resume_browser_agent(job_id))

    return job_data


@router.post("/agent-jobs/{job_id}/reject")
async def reject_job(
    job_id: str,
    data: RejectRequest,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = db.table("agent_jobs").select("id, status").eq(
        "id", job_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")

    result = db.table("agent_jobs").update({
        "status": "rejected",
        "rejected_reason": data.reason,
    }).eq("id", job_id).eq("agency_id", user.agency_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="agent_job.rejected",
        entity_type="agent_job",
        entity_id=job_id,
        new_value={"reason": data.reason},
        ip_address=request.client.host if request.client else None,
    )

    return result.data[0] if result.data else {}


async def _resume_browser_agent(job_id: str):
    try:
        from agents.browser import BrowserAgent
        agent = BrowserAgent()
        await agent.resume_after_approval(job_id)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Browser agent resume failed for job {job_id}: {e}")
