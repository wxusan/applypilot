from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from core.audit import write_audit_log
from core.config import settings
from models.user import AuthUser
from openai import AsyncOpenAI

router = APIRouter(tags=["Essays"])


class EssayUpdate(BaseModel):
    content: Optional[str] = Field(default=None, max_length=50000)
    status: Optional[str] = Field(default=None, max_length=50)
    prompt_text: Optional[str] = Field(default=None, max_length=5000)


class EssayGenerateRequest(BaseModel):
    student_id: str
    application_id: Optional[str] = None
    prompt_text: str = Field(min_length=10, max_length=5000)
    prompt_type: str = Field(default="personal_statement", max_length=50)  # personal_statement | supplemental


class EssayVersionResponse(BaseModel):
    id: str
    version_number: int
    word_count: int
    is_ai_generated: bool
    ai_score: Optional[int]
    change_summary: Optional[str]
    created_at: str


class PlagiarismCheckResponse(BaseModel):
    score: int
    note: str


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

    # Idempotency check: if a generation job is already running for this student
    # and prompt_type, return the existing job instead of creating a duplicate.
    existing_job = db.table("agent_jobs").select("id, status").eq(
        "student_id", data.student_id
    ).eq("agency_id", user.agency_id).eq(
        "job_type", "essay_generation"
    ).in_("status", ["pending", "running", "awaiting_approval"]).order(
        "created_at", desc=True
    ).limit(1).execute()

    if existing_job.data:
        job = existing_job.data[0]
        return {"job_id": job["id"], "status": job["status"], "reused": True}

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

    existing = db.table("essays").select("id, student_id, content, word_count, version").eq(
        "id", essay_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Essay not found")

    payload = {k: v for k, v in data.model_dump().items() if v is not None}

    # Auto-save current content to essay_versions before updating if content is being changed
    if "content" in payload and existing.data.get("content"):
        old_content = existing.data.get("content")
        old_word_count = existing.data.get("word_count", 0)
        current_version = existing.data.get("version", 1)

        version_payload = {
            "essay_id": essay_id,
            "agency_id": user.agency_id,
            "version_number": current_version,
            "content": old_content,
            "word_count": old_word_count,
            "is_ai_generated": False,
            "created_by": user.id,
        }

        db.table("essay_versions").insert(version_payload).execute()

        # Increment version for the update
        payload["version"] = current_version + 1

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


@router.get("/essays/{essay_id}/versions")
async def list_essay_versions(
    essay_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """List all versions of an essay ordered by version_number desc."""
    db = get_service_client()

    # Verify essay ownership (ISOLATION)
    essay = db.table("essays").select("id").eq(
        "id", essay_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not essay.data:
        raise HTTPException(status_code=404, detail="Essay not found")

    # Fetch all versions
    result = db.table("essay_versions").select(
        "id, version_number, word_count, is_ai_generated, ai_score, change_summary, created_at"
    ).eq("essay_id", essay_id).eq("agency_id", user.agency_id).order(
        "version_number", desc=True
    ).execute()

    return {"versions": result.data or []}


@router.get("/essays/{essay_id}/versions/{version_number}")
async def get_essay_version(
    essay_id: str,
    version_number: int,
    user: AuthUser = Depends(get_current_user),
):
    """Get a specific version of an essay including full content."""
    db = get_service_client()

    # Verify essay ownership (ISOLATION)
    essay = db.table("essays").select("id").eq(
        "id", essay_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not essay.data:
        raise HTTPException(status_code=404, detail="Essay not found")

    # Fetch the specific version
    result = db.table("essay_versions").select("*").eq(
        "essay_id", essay_id
    ).eq("version_number", version_number).eq(
        "agency_id", user.agency_id
    ).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Essay version not found")

    return result.data


@router.post("/essays/{essay_id}/check-plagiarism")
async def check_plagiarism(
    essay_id: str,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    """
    Check originality score of essay using OpenAI.
    Updates essay.plagiarism_score and returns the score and explanation.
    """
    db = get_service_client()

    # Fetch essay
    essay = db.table("essays").select("id, content, student_id").eq(
        "id", essay_id
    ).eq("agency_id", user.agency_id).single().execute()

    if not essay.data:
        raise HTTPException(status_code=404, detail="Essay not found")

    essay_content = essay.data.get("content")
    if not essay_content:
        raise HTTPException(status_code=400, detail="Essay has no content to check")

    # Call OpenAI to estimate originality
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    system_prompt = (
        "You are an academic integrity checker. Given an essay, estimate its originality score "
        "from 0-100 (100=completely original, 0=plagiarized). Consider clichéd phrases, generic structures, "
        "and suspiciously polished language. Return ONLY valid JSON: {\"score\": 85, \"note\": \"One sentence explanation\"}"
    )

    try:
        response = await client.chat.completions.create(
            model=settings.AI_MODEL_FAST,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this essay for originality:\n\n{essay_content}"},
            ],
            temperature=0.3,
            max_tokens=200,
        )

        content = response.choices[0].message.content or "{}"
        # Parse JSON response
        import json
        result_json = json.loads(content)

        score = int(result_json.get("score", 50))
        note = str(result_json.get("note", "Unable to determine originality"))

        # Clamp score to 0-100
        score = max(0, min(100, score))

        # Update essay with plagiarism score
        db.table("essays").update({
            "plagiarism_score": score,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", essay_id).eq("agency_id", user.agency_id).execute()

        # Audit log
        await write_audit_log(
            agency_id=user.agency_id,
            user_id=user.id,
            student_id=essay.data.get("student_id"),
            action="essay.plagiarism_checked",
            entity_type="essay",
            entity_id=essay_id,
            new_value={"plagiarism_score": score},
            ip_address=request.client.host if request.client else None,
        )

        return {"score": score, "note": note}

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Plagiarism check failed: {str(e)}"
        )
