from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser

router = APIRouter(tags=["Essays"])


class EssayUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    prompt_text: Optional[str] = None


class EssayGenerateRequest(BaseModel):
    student_id: str
    application_id: Optional[str] = None
    prompt_text: str
    prompt_type: str = "personal_statement"  # personal_statement | supplemental


@router.get("/essays")
async def list_essays(
    student_id: Optional[str] = Query(None),
    application_id: Optional[str] = Query(None),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = db.table("essays").select(
        "id, student_id, application_id, prompt_text, content, word_count, version, "
        "status, ai_score, ai_feedback, plagiarism_score, created_at, updated_at"
    ).eq("agency_id", user.agency_id)  # ISOLATION

    if student_id:
        query = query.eq("student_id", student_id)
    if application_id:
        query = query.eq("application_id", application_id)

    result = query.order("created_at", desc=True).execute()
    return {"essays": result.data}


@router.get("/essays/{essay_id}")
async def get_essay(
    essay_id: str,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    result = db.table("essays").select("*").eq("id", essay_id).eq(
        "agency_id", user.agency_id
    ).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Essay not found")

    return result.data


@router.post("/essays/generate", status_code=202)
async def generate_essay(
    data: EssayGenerateRequest,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """Trigger the Writer agent to generate an essay draft. Returns job_id."""
    db = get_service_client()

    # Verify student ownership (ISOLATION)
    student = db.table("students").select("*").eq(
        "id", data.student_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not student.data:
        raise HTTPException(status_code=404, detail="Student not found")

    # Create agent job
    job_result = db.table("agent_jobs").insert({
        "agency_id": user.agency_id,
        "student_id": data.student_id,
        "application_id": data.application_id,
        "agent_type": "writer",
        "job_type": "essay_generation",
        "status": "pending",
        "input_data": {
            "prompt_text": data.prompt_text,
            "prompt_type": data.prompt_type,
        },
        "requires_approval": True,
    }).execute()

    if not job_result.data:
        raise HTTPException(status_code=500, detail="Failed to create agent job")

    job = job_result.data[0]

    # Trigger writer agent asynchronously
    import asyncio
    asyncio.create_task(_run_writer_agent(job["id"], student.data, data.prompt_text, data.prompt_type, data.application_id))

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=data.student_id,
        action="essay.generation_requested",
        entity_type="agent_job",
        entity_id=job["id"],
        ip_address=request.client.host if request.client else None,
    )

    return {"job_id": job["id"], "status": "pending"}


async def _run_writer_agent(job_id: str, student: dict, prompt_text: str, prompt_type: str, application_id: Optional[str] = None):
    """
    Background task: generate an essay draft using WriterAgent helpers and update
    the pre-created agent_job in-place (avoids creating a duplicate job record).
    """
    import logging
    logger = logging.getLogger(__name__)
    db = get_service_client()
    agency_id = student.get("agency_id")

    # Mark job as running
    db.table("agent_jobs").update({
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).execute()

    try:
        from agents.writer import WriterAgent
        agent = WriterAgent()

        # Use WriterAgent's private LLM helpers directly so we can attach output
        # to the already-created agent_job instead of creating a duplicate record.
        draft = await agent._generate_essay(student, prompt_text, prompt_type)
        score = await agent._score_content(draft, prompt_text)
        word_count = len(draft.split())

        # Persist essay draft
        essay_payload: dict = {
            "agency_id": agency_id,
            "student_id": student["id"],
            "prompt_text": prompt_text,
            "content": draft,
            "word_count": word_count,
            "status": "draft",
            "ai_score": score,
            "version": 1,
        }
        if application_id:
            essay_payload["application_id"] = application_id
        essay_res = db.table("essays").insert(essay_payload).execute()
        essay_id = essay_res.data[0]["id"] if essay_res.data else None

        header = (
            f"📝 *Essay Draft Ready*\n"
            f"Student: {student['full_name']}\n"
            f"Type: {prompt_type.replace('_', ' ').title()}\n"
            f"Words: {word_count}\n"
            f"AI Score: {score}/100\n"
            f"━━━━━━━━━━━━━━━\n"
            f"*Full Draft:*\n\n"
        )
        full_text = header + draft

        db.table("agent_jobs").update({
            "status": "awaiting_approval",
            "approval_message": header + draft[:400] + ("…" if len(draft) > 400 else ""),
            "output_data": {
                "essay_id": essay_id,
                "word_count": word_count,
                "ai_score": score,
            },
        }).eq("id", job_id).execute()

        # Send full draft to Telegram for approval
        await agent._send_full_approval(
            agency_id=agency_id,
            job_id=job_id,
            full_text=full_text,
        )

    except Exception as e:
        logger.error(f"Writer agent failed for job {job_id}: {e}")
        db.table("agent_jobs").update({
            "status": "failed",
            "error_message": str(e),
        }).eq("id", job_id).execute()


@router.patch("/essays/{essay_id}")
async def update_essay(
    essay_id: str,
    data: EssayUpdate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    existing = db.table("essays").select("id, student_id").eq(
        "id", essay_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Essay not found")

    payload = {k: v for k, v in data.model_dump().items() if v is not None}

    if "content" in payload:
        payload["word_count"] = len(payload["content"].split())

    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = db.table("essays").update(payload).eq("id", essay_id).eq(
        "agency_id", user.agency_id
    ).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        student_id=existing.data.get("student_id"),
        action="essay.updated",
        entity_type="essay",
        entity_id=essay_id,
        new_value={"status": payload.get("status")},
        ip_address=request.client.host if request.client else None,
    )

    return result.data[0] if result.data else existing.data


@router.post("/essays/{essay_id}/approve")
async def approve_essay(
    essay_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    result = db.table("essays").update({
        "status": "approved",
        "approved_by": user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", essay_id).eq("agency_id", user.agency_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Essay not found")

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="essay.approved",
        entity_type="essay",
        entity_id=essay_id,
        ip_address=request.client.host if request.client else None,
    )

    return result.data[0]
