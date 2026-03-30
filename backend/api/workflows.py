"""
Automation Workflows API — Phase 4B
Manages the full application automation workflow per student.

Endpoints:
  POST /api/workflows                    — create workflow
  GET  /api/workflows?student_id=        — list workflows
  GET  /api/workflows/{id}               — get workflow + steps
  POST /api/workflows/{id}/start         — begin execution
  POST /api/workflows/{id}/pause         — pause
  POST /api/workflows/{id}/resume        — resume
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Workflows"])


class UniversityEntry(BaseModel):
    name: str
    round: str  # 'ED' | 'ED2' | 'EA' | 'REA' | 'RD'


class WorkflowCreate(BaseModel):
    student_id: str
    universities: List[UniversityEntry]
    notes: Optional[str] = None


@router.post("/workflows")
async def create_workflow(body: WorkflowCreate, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    # Verify student
    student = db.table("students").select("id, agency_id, full_name").eq("id", body.student_id).single().execute()
    if not student.data or student.data['agency_id'] != user.agency_id:
        raise HTTPException(404, "Student not found")

    universities = [{"name": u.name, "round": u.round, "status": "pending", "submitted_at": None} for u in body.universities]

    payload = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "agency_id": user.agency_id,
        "status": "draft",
        "current_step": 0,
        "universities": universities,
        "started_by": user.id,
        "notes": body.notes,
    }

    result = db.table("automation_workflows").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create workflow")

    # Auto-create all steps in order
    workflow_id = result.data[0]['id']
    _create_steps(db, workflow_id, user.agency_id, body.student_id, universities)

    return result.data[0]


def _create_steps(db, workflow_id: str, agency_id: str, student_id: str, universities: list):
    """Create all automation steps for a workflow in sequence."""
    steps = []
    idx = 0

    def add(step_type: str, step_name: str, metadata: dict = {}):
        nonlocal idx
        steps.append({
            "id": str(uuid.uuid4()),
            "workflow_id": workflow_id,
            "agency_id": agency_id,
            "step_index": idx,
            "step_type": step_type,
            "step_name": step_name,
            "status": "pending",
            "screenshots": [],
            "metadata": {"student_id": student_id, **metadata},
        })
        idx += 1

    # Phase 1: Student Common App
    add("gmail_login_student", "Log into student Gmail")
    add("common_app_login_student", "Create / log into student Common App")
    add("common_app_personal_info", "Fill Personal Information")
    add("common_app_family", "Fill Family Information")
    add("common_app_education", "Fill Education History")
    add("common_app_test_scores", "Fill Test Scores")
    add("common_app_activities", "Fill Activities")
    add("common_app_personal_statement", "Generate & fill Personal Statement", {"requires_ai": True})
    add("common_app_add_universities", "Add universities to Common App", {"universities": universities})

    # One supplement + submit step per university
    for u in universities:
        add("common_app_supplement", f"Fill supplements — {u['name']}", {"university": u['name'], "round": u['round'], "requires_ai": True})
        add("common_app_submit", f"Submit application — {u['name']}", {"university": u['name'], "round": u['round']})

    # Phase 2: Teacher
    add("gmail_login_teacher", "Log into teacher Gmail")
    add("teacher_find_invitation", "Find Common App invitation in teacher email")
    add("teacher_create_account", "Create teacher Common App account")
    add("teacher_fill_profile", "Fill teacher profile")
    add("teacher_rec_letter", "Generate & fill recommendation letter (teacher)", {"requires_ai": True})
    add("teacher_submit", "Submit teacher recommendation")

    # Phase 3: Counsellor
    add("gmail_login_counsellor", "Log into counsellor Gmail")
    add("counsellor_find_invitation", "Find Common App invitation in counsellor email")
    add("counsellor_create_account", "Create counsellor Common App account")
    add("counsellor_fill_profile", "Fill counsellor profile")
    add("counsellor_upload_documents", "Upload documents (transcript, test scores)")
    add("counsellor_rec_letter", "Generate & fill recommendation letter (counsellor)", {"requires_ai": True})
    add("counsellor_submit", "Submit counsellor section")

    # Phase 4: Monitoring
    add("email_monitor_check", "Monitor student Gmail for university emails")
    add("decision_download", "Check for and download admission decisions")

    if steps:
        db.table("automation_steps").insert(steps).execute()


@router.get("/workflows")
async def list_workflows(student_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    result = db.table("automation_workflows")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("agency_id", user.agency_id)\
        .order("created_at", desc=True)\
        .execute()

    return result.data or []


@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    workflow = db.table("automation_workflows")\
        .select("*")\
        .eq("id", workflow_id)\
        .eq("agency_id", user.agency_id)\
        .single()\
        .execute()

    if not workflow.data:
        raise HTTPException(404, "Workflow not found")

    steps = db.table("automation_steps")\
        .select("*")\
        .eq("workflow_id", workflow_id)\
        .order("step_index")\
        .execute()

    return {**workflow.data, "steps": steps.data or []}


@router.post("/workflows/{workflow_id}/start")
async def start_workflow(workflow_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()

    workflow = db.table("automation_workflows").select("*").eq("id", workflow_id).eq("agency_id", user.agency_id).single().execute()
    if not workflow.data:
        raise HTTPException(404, "Workflow not found")
    if workflow.data['status'] not in ('draft', 'paused'):
        raise HTTPException(400, f"Cannot start workflow in status: {workflow.data['status']}")

    db.table("automation_workflows").update({"status": "running", "started_at": "now()"}).eq("id", workflow_id).execute()

    # Trigger first step (in Phase 4C this will kick off the agent)
    # For now, just mark first pending step as queued
    first_step = db.table("automation_steps")\
        .select("id")\
        .eq("workflow_id", workflow_id)\
        .eq("status", "pending")\
        .order("step_index")\
        .limit(1)\
        .execute()

    if first_step.data:
        db.table("automation_steps").update({"status": "queued"}).eq("id", first_step.data[0]['id']).execute()

    return {"success": True, "status": "running"}


@router.post("/workflows/{workflow_id}/pause")
async def pause_workflow(workflow_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    workflow = db.table("automation_workflows").select("id, agency_id").eq("id", workflow_id).eq("agency_id", user.agency_id).single().execute()
    if not workflow.data:
        raise HTTPException(404, "Workflow not found")
    db.table("automation_workflows").update({"status": "paused"}).eq("id", workflow_id).execute()
    return {"success": True, "status": "paused"}


@router.post("/workflows/{workflow_id}/resume")
async def resume_workflow(workflow_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    workflow = db.table("automation_workflows").select("id, agency_id, status").eq("id", workflow_id).eq("agency_id", user.agency_id).single().execute()
    if not workflow.data:
        raise HTTPException(404, "Workflow not found")
    if workflow.data['status'] != 'paused':
        raise HTTPException(400, "Workflow is not paused")
    db.table("automation_workflows").update({"status": "running"}).eq("id", workflow_id).execute()
    return {"success": True, "status": "running"}
