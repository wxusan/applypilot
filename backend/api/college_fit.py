"""
College Fit Engine — Phase 2.

POST /api/students/{student_id}/college-fit
  Analyzes the student's profile (GPA, test scores, activities, essays) and
  returns a list of college recommendations bucketed as reach / target / safety,
  each with a fit score (0-100) and reasoning.

The result is cached in the agent_jobs table as a completed job so the front-end
can re-fetch it instantly on subsequent page loads without re-calling OpenAI.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["College Fit"])

SYSTEM_PROMPT = """
You are an expert college admissions counselor with 20+ years of experience placing
students at top universities worldwide.

Given a student profile you must return a JSON array of college recommendations.
Each element must have exactly these keys:
  - name         (string)  college name
  - category     (string)  one of: "reach", "target", "safety"
  - fit_score    (integer) 0-100, higher = stronger fit
  - why          (string)  2-3 sentence explanation of the fit
  - strengths    (array of strings)  up to 3 profile strengths that align
  - gaps         (array of strings)  up to 2 areas the student should strengthen

Return ONLY the JSON array. No markdown, no extra text.
"""


async def _generate_college_fit(student: dict) -> list[dict]:
    """Call OpenAI and return a list of college fit recommendations."""
    from openai import AsyncOpenAI
    from core.config import settings

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    profile_summary = f"""
Student: {student.get('full_name', 'Unknown')}
GPA: {student.get('gpa', 'N/A')} / {student.get('gpa_scale', 4.0)}
SAT: {student.get('sat_total', 'N/A')}
ACT: {student.get('act_score', 'N/A')}
Graduation Year: {student.get('graduation_year', 'N/A')}
High School: {student.get('high_school_name', 'N/A')} ({student.get('high_school_country', 'N/A')})
Intended Major: {student.get('intended_major', 'Undecided')}
Extracurriculars: {student.get('extracurriculars', 'N/A')}
Awards/Honors: {student.get('awards', 'N/A')}
Notes: {student.get('notes', 'N/A')}
""".strip()

    response = await client.chat.completions.create(
        model=settings.AI_MODEL_FAST,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Generate 9 college recommendations for this student:\n\n{profile_summary}"},
        ],
        temperature=0.5,
        max_tokens=2000,
    )

    content = response.choices[0].message.content or "[]"
    # Strip any accidental markdown fences
    content = content.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
    return json.loads(content)


@router.get("/students/{student_id}/college-fit")
async def get_college_fit(
    student_id: str,
    refresh: bool = False,
    user: AuthUser = Depends(get_current_user),
):
    """
    Return college fit recommendations for a student.
    - First call: generates via OpenAI and caches the result.
    - Subsequent calls: returns the cached result from agent_jobs.
    - ?refresh=true forces regeneration.
    """
    db = get_service_client()

    # Verify student ownership (ISOLATION)
    student_res = db.table("students").select("*").eq(
        "id", student_id
    ).eq("agency_id", user.agency_id).maybe_single().execute()

    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student not found")

    student = student_res.data

    # Check for a cached result
    if not refresh:
        cached = (
            db.table("agent_jobs")
            .select("output_data, created_at")
            .eq("agency_id", user.agency_id)
            .eq("student_id", student_id)
            .eq("job_type", "college_fit")
            .eq("status", "completed")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if cached.data:
            job = cached.data[0]
            recommendations = (job.get("output_data") or {}).get("recommendations", [])
            if recommendations:
                return {
                    "recommendations": recommendations,
                    "generated_at": job["created_at"],
                    "cached": True,
                }

    # Generate fresh recommendations
    # Create a job record
    job_res = db.table("agent_jobs").insert({
        "agency_id": user.agency_id,
        "student_id": student_id,
        "agent_type": "writer",
        "job_type": "college_fit",
        "status": "running",
        "requires_approval": False,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    if not job_res.data:
        raise HTTPException(status_code=500, detail="Failed to create job")

    job_id = job_res.data[0]["id"]

    try:
        recommendations = await _generate_college_fit(student)

        db.table("agent_jobs").update({
            "status": "completed",
            "output_data": {"recommendations": recommendations},
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", job_id).execute()

        return {
            "recommendations": recommendations,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "cached": False,
        }

    except Exception as exc:
        logger.error(f"College fit generation failed for student {student_id}: {exc}")
        db.table("agent_jobs").update({
            "status": "failed",
            "error_message": str(exc),
        }).eq("id", job_id).execute()
        raise HTTPException(status_code=500, detail=f"AI generation failed: {exc}")
