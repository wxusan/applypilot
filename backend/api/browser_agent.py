"""
Browser Agent API — starts and manages Common App automation jobs.
agency_id always from JWT. All actions write to audit_logs.
"""

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Browser Agent"])


class BrowserStartRequest(BaseModel):
    student_id: str
    application_id: str


@router.post("/agents/browser/start")
async def start_browser_agent(
    data: BrowserStartRequest,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """
    Validate student + application belong to the agency, create an agent_job,
    and launch the Common App fill flow as a background task.
    Returns the job_id immediately — the browser runs async.
    """
    db = get_service_client()

    # Validate student belongs to this agency
    student = db.table("students").select("id, full_name, status").eq(
        "id", data.student_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not student.data:
        raise HTTPException(status_code=404, detail="Student not found")

    # Validate application belongs to this agency and this student
    application = db.table("applications").select(
        "id, university_name, status, portal_password_encrypted"
    ).eq("id", data.application_id).eq(
        "agency_id", user.agency_id
    ).eq("student_id", data.student_id).single().execute()

    if not application.data:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.data["status"] == "submitted":
        raise HTTPException(
            status_code=400,
            detail="Application has already been submitted",
        )

    if not application.data.get("portal_password_encrypted"):
        raise HTTPException(
            status_code=400,
            detail="No portal credentials saved. Add them in the application settings first.",
        )

    # Check for an already-running browser job for this application
    active = db.table("agent_jobs").select("id, status").eq(
        "agency_id", user.agency_id
    ).eq("application_id", data.application_id).eq(
        "agent_type", "browser"
    ).in_("status", ["pending", "running", "awaiting_approval"]).execute()

    if active.data:
        existing_job_id = active.data[0]["id"]
        raise HTTPException(
            status_code=409,
            detail=f"A browser job is already active for this application (job_id: {existing_job_id})",
        )

    # Create the parent agent_job
    now = datetime.now(timezone.utc).isoformat()
    job_res = db.table("agent_jobs").insert({
        "agency_id": user.agency_id,
        "student_id": data.student_id,
        "application_id": data.application_id,
        "agent_type": "browser",
        "job_type": "fill_common_app",
        "status": "pending",
        "requires_approval": True,
        "created_at": now,
        "output_data": {
            "step": 0,
            "session_id": None,
            "student_id": data.student_id,
            "application_id": data.application_id,
            "agency_id": user.agency_id,
            "completed_steps": [],
        },
    }).execute()

    if not job_res.data:
        raise HTTPException(status_code=500, detail="Failed to create agent job")

    job_id = job_res.data[0]["id"]

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=data.student_id,
        application_id=data.application_id,
        action="browser.started",
        entity_type="agent_job",
        entity_id=job_id,
        new_value={
            "university": application.data["university_name"],
            "triggered_by": user.id,
        },
        ip_address=request.client.host if request.client else None,
    )

    # Launch as a background asyncio task — returns immediately
    asyncio.create_task(
        _run_browser_agent(
            job_id=job_id,
            student_id=data.student_id,
            application_id=data.application_id,
            agency_id=user.agency_id,
        )
    )

    return {
        "job_id": job_id,
        "status": "pending",
        "message": (
            f"Browser agent started for {student.data['full_name']} → "
            f"{application.data['university_name']}. "
            f"Check Telegram for approval requests."
        ),
    }


@router.get("/agents/browser/{job_id}")
async def get_browser_agent_status(
    job_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Return current status, screenshots, and message for a browser agent job."""
    db = get_service_client()

    job = db.table("agent_jobs").select(
        "id, status, error_message, approval_message, screenshot_urls, output_data, created_at"
    ).eq("id", job_id).eq("agency_id", user.agency_id).eq(
        "agent_type", "browser"
    ).single().execute()

    if not job.data:
        raise HTTPException(status_code=404, detail="Browser job not found")

    j = job.data
    return {
        "job_id": j["id"],
        "status": j["status"],
        "screenshots": j.get("screenshot_urls") or [],
        "message": j.get("approval_message") or j.get("error_message") or "",
        "output_data": j.get("output_data") or {},
        "created_at": j.get("created_at"),
    }


@router.post("/agents/browser/{job_id}/stop")
async def stop_browser_agent(
    job_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """
    Cancel a running browser agent job.
    Sets status to 'rejected' so the next approval-gate poll terminates the task.
    """
    db = get_service_client()

    job = db.table("agent_jobs").select("id, status, student_id, application_id").eq(
        "id", job_id
    ).eq("agency_id", user.agency_id).eq("agent_type", "browser").single().execute()

    if not job.data:
        raise HTTPException(status_code=404, detail="Browser job not found")

    j = job.data
    if j["status"] in ("completed", "failed", "rejected"):
        raise HTTPException(
            status_code=400,
            detail=f"Job is already in terminal state: {j['status']}",
        )

    db.table("agent_jobs").update({
        "status": "rejected",
        "rejected_reason": "Stopped by user",
        "error_message": "Stopped by user via dashboard",
    }).eq("id", job_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=j.get("student_id"),
        application_id=j.get("application_id"),
        action="browser.stopped",
        entity_type="agent_job",
        entity_id=job_id,
        new_value={"stopped_by": user.id},
        ip_address=request.client.host if request.client else None,
    )

    return {"job_id": job_id, "status": "rejected", "message": "Browser agent stopped"}


async def _run_browser_agent(
    job_id: str,
    student_id: str,
    application_id: str,
    agency_id: str,
) -> None:
    """Background task wrapper — errors are caught and logged."""
    try:
        from agents.browser import BrowserAgent
        agent = BrowserAgent()
        await agent.fill_common_app(
            job_id=job_id,
            student_id=student_id,
            application_id=application_id,
            agency_id=agency_id,
        )
    except Exception as exc:
        logger.error(f"Browser agent task failed for job {job_id}: {exc}")
