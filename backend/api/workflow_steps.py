"""
Workflow Steps API — Phase 4B
Coordinator approval / rejection of individual automation steps.

Endpoints:
  GET  /api/workflow-steps/{id}         — step detail with screenshots
  POST /api/workflow-steps/{id}/approve — approve (+ optional edited content)
  POST /api/workflow-steps/{id}/reject  — reject with reason
  POST /api/workflow-steps/{id}/retry   — retry failed step
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Workflow Steps"])


class ApproveBody(BaseModel):
    edited_content: Optional[str] = None  # If coordinator edited the AI content


class RejectBody(BaseModel):
    reason: str


@router.get("/workflow-steps/{step_id}")
async def get_step(step_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    step = db.table("automation_steps").select("*").eq("id", step_id).eq("agency_id", user.agency_id).single().execute()
    if not step.data:
        raise HTTPException(404, "Step not found")
    return step.data


@router.post("/workflow-steps/{step_id}/approve")
async def approve_step(step_id: str, body: ApproveBody, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    step = db.table("automation_steps").select("*").eq("id", step_id).eq("agency_id", user.agency_id).single().execute()
    if not step.data:
        raise HTTPException(404, "Step not found")
    if step.data['status'] != 'awaiting_approval':
        raise HTTPException(400, f"Step is not awaiting approval (status: {step.data['status']})")

    final_content = body.edited_content if body.edited_content else step.data.get('ai_content')

    updates = {
        "status": "approved",
        "approved_by": user.id,
        "approved_at": "now()",
        "final_content": final_content,
    }
    if body.edited_content:
        updates["coordinator_content"] = body.edited_content

    db.table("automation_steps").update(updates).eq("id", step_id).execute()

    # Mark next pending step as queued (agent will pick it up)
    _advance_workflow(db, step.data['workflow_id'])

    return {"success": True, "status": "approved"}


@router.post("/workflow-steps/{step_id}/reject")
async def reject_step(step_id: str, body: RejectBody, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    step = db.table("automation_steps").select("*").eq("id", step_id).eq("agency_id", user.agency_id).single().execute()
    if not step.data:
        raise HTTPException(404, "Step not found")

    db.table("automation_steps").update({
        "status": "rejected",
        "rejected_reason": body.reason,
    }).eq("id", step_id).execute()

    # Pause the whole workflow
    db.table("automation_workflows").update({"status": "paused"}).eq("id", step.data['workflow_id']).execute()

    return {"success": True, "status": "rejected"}


@router.post("/workflow-steps/{step_id}/retry")
async def retry_step(step_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    step = db.table("automation_steps").select("*").eq("id", step_id).eq("agency_id", user.agency_id).single().execute()
    if not step.data:
        raise HTTPException(404, "Step not found")
    if step.data['status'] not in ('failed', 'rejected'):
        raise HTTPException(400, "Step can only be retried if failed or rejected")

    db.table("automation_steps").update({
        "status": "queued",
        "error_message": None,
        "rejected_reason": None,
    }).eq("id", step_id).execute()

    # Resume workflow
    db.table("automation_workflows").update({"status": "running"}).eq("id", step.data['workflow_id']).execute()

    return {"success": True, "status": "queued"}


def _advance_workflow(db, workflow_id: str):
    """Find the next pending step and mark it queued."""
    next_step = db.table("automation_steps")\
        .select("id")\
        .eq("workflow_id", workflow_id)\
        .eq("status", "pending")\
        .order("step_index")\
        .limit(1)\
        .execute()
    if next_step.data:
        db.table("automation_steps").update({"status": "queued"}).eq("id", next_step.data[0]['id']).execute()
