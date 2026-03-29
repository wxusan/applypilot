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


class CreateJobRequest(BaseModel):
    student_id: Optional[str] = None
    application_id: Optional[str] = None
    agent_type: str
    job_type: str
    input_data: Optional[dict] = None
    approval_message: Optional[str] = None


@router.get("/agent-jobs")
async def list_agent_jobs(
    status: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    agent_type: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = db.table("agent_jobs").select(
        "id, agent_type, job_type, status, approval_message, screenshot_urls, "
        "created_at, completed_at, duration_seconds, error_message, "
        "student_id, application_id, output_data, "
        "student:students(id, full_name)",
        count="exact",
    ).eq("agency_id", user.agency_id)  # ISOLATION

    if status:
        query = query.eq("status", status)
    if student_id:
        query = query.eq("student_id", student_id)
    if agent_type:
        query = query.eq("agent_type", agent_type)
    if job_type:
        query = query.eq("job_type", job_type)

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"jobs": result.data, "total": result.count}


@router.post("/agent-jobs", status_code=201)
async def create_agent_job(
    body: CreateJobRequest,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """Create a generic agent job (e.g. email reply draft, document analysis)."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()

    # If student_id provided, verify it belongs to this agency
    if body.student_id:
        student = db.table("students").select("id").eq("id", body.student_id).eq(
            "agency_id", user.agency_id
        ).single().execute()
        if not student.data:
            raise HTTPException(404, "Student not found")

    row = {
        "agency_id": user.agency_id,
        "agent_type": body.agent_type,
        "job_type": body.job_type,
        "status": "awaiting_approval",
        "approval_message": body.approval_message or f"New {body.job_type} job ready for review.",
        "input_data": body.input_data or {},
    }
    if body.student_id:
        row["student_id"] = body.student_id
    if body.application_id:
        row["application_id"] = body.application_id

    result = db.table("agent_jobs").insert(row).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create job")

    job = result.data[0]

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="agent_job.created",
        entity_type="agent_job",
        entity_id=job["id"],
        new_value={"agent_type": body.agent_type, "job_type": body.job_type},
        ip_address=request.client.host if request.client else None,
    )

    return job


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
