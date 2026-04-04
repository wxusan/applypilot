"""
Writer Agent — generates essays, recommendation letters, and email reply drafts.
Sends full output to Telegram for human approval before marking as approved.
All writes go to audit_logs. Credentials never logged.

Token-saving strategies:
  1. Hash-based essay caching — skips LLM if student+prompt inputs are unchanged.
  2. Compressed scoring soul — _score_content uses a short ~80-token system prompt
     instead of the full 600-token ESSAY_AGENT soul.
  3. Score cache — essays.ai_score is reused when a cache hit occurs; no second LLM call.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone

from openai import AsyncOpenAI

from core.db import get_service_client
from core.config import settings
from core.audit import write_audit_log
from services.telegram_bot import send_approval_request, send_message_to_agency_staff
from agents.souls import load_soul

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# ── Strategy 2: Compressed scoring soul ──────────────────────────────────────
# Loaded from agents/souls/SCORE_SOUL.md — ~80 tokens vs ~600 for ESSAY_AGENT.
# Saves ~520 tokens per scoring call (Strategy 2).
_SCORE_SOUL = load_soul("SCORE_SOUL")


# ── Strategy 1+3: Generation hash helpers ────────────────────────────────────

def _make_generation_hash(student_id: str, prompt_id: str, student: dict) -> str:
    """
    Deterministic fingerprint of the inputs that drive essay generation.
    If all these fields are unchanged, re-generation would produce the same output.
    """
    key = json.dumps({
        "student_id": student_id,
        "prompt_id": prompt_id,
        "gpa": student.get("gpa"),
        "nationality": student.get("nationality"),
        "intended_major": student.get("intended_major"),
        "activities_len": len(student.get("activities") or []),
        "awards_len": len(student.get("awards") or []),
    }, sort_keys=True)
    return hashlib.sha256(key.encode()).hexdigest()[:16]

# Telegram hard limit per message (leave 96 chars for the bot header)
_TG_MAX = 4000


class WriterAgent:

    # ------------------------------------------------------------------ #
    #  Public dispatcher                                                   #
    # ------------------------------------------------------------------ #

    async def run(
        self,
        student_id: str,
        task_type: str,
        agency_id: str,
        **kwargs,
    ) -> None:
        """
        Entry point.  task_type ∈ {'essay', 'rec_letter', 'email_reply'}.
        kwargs:
          essay       → prompt_id (str)
          rec_letter  → recommender_id (str)
          email_reply → email_id (str)
        """
        db = get_service_client()

        student_res = db.table("students").select(
            "id, full_name, nationality, high_school_name, high_school_country, "
            "graduation_year, gpa, gpa_scale, intended_major, sat_total, "
            "activities, awards, agency_id"
        ).eq("id", student_id).eq("agency_id", agency_id).single().execute()

        if not student_res.data:
            logger.error(
                f"WriterAgent: student {student_id} not found or not in agency {agency_id}"
            )
            return

        student = student_res.data

        if task_type == "essay":
            prompt_id = kwargs.get("prompt_id")
            if not prompt_id:
                logger.error("WriterAgent: essay task requires prompt_id kwarg")
                return
            await self._run_essay(student, agency_id, prompt_id)

        elif task_type == "rec_letter":
            recommender_id = kwargs.get("recommender_id")
            if not recommender_id:
                logger.error("WriterAgent: rec_letter task requires recommender_id kwarg")
                return
            await self._run_rec_letter(student, agency_id, recommender_id)

        elif task_type == "email_reply":
            email_id = kwargs.get("email_id")
            if not email_id:
                logger.error("WriterAgent: email_reply task requires email_id kwarg")
                return
            await self._run_email_reply(student, agency_id, email_id)

        else:
            logger.error(f"WriterAgent: unknown task_type '{task_type}'")

    # ------------------------------------------------------------------ #
    #  Essay                                                               #
    # ------------------------------------------------------------------ #

    async def _run_essay(self, student: dict, agency_id: str, prompt_id: str) -> None:
        db = get_service_client()

        prompt_res = db.table("essay_prompts").select(
            "id, prompt_text, prompt_type, word_limit_min, word_limit_max"
        ).eq("id", prompt_id).execute()

        if not prompt_res.data:
            logger.error(f"WriterAgent: essay prompt {prompt_id} not found")
            return

        prompt = prompt_res.data[0]
        prompt_text = prompt["prompt_text"]
        prompt_type = prompt.get("prompt_type") or "supplemental"
        word_limit_max = prompt.get("word_limit_max") or 650
        word_limit_min = prompt.get("word_limit_min") or 0

        # Create agent_job (status=running)
        job_res = db.table("agent_jobs").insert({
            "agency_id": agency_id,
            "student_id": student["id"],
            "agent_type": "writer",
            "job_type": "essay",
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "requires_approval": True,
        }).execute()

        if not job_res.data:
            logger.error("WriterAgent: failed to create agent_job for essay")
            return

        job_id = job_res.data[0]["id"]

        try:
            # ── Strategy 1: Check generation cache ───────────────────────
            gen_hash = _make_generation_hash(student["id"], prompt_id, student)
            cache_hit = db.table("agent_jobs").select("id, output_data").eq(
                "agency_id", agency_id
            ).eq("agent_type", "writer").eq("job_type", "essay").in_(
                "status", ["awaiting_approval", "completed"]
            ).order("created_at", desc=True).limit(10).execute()

            for cached_job in (cache_hit.data or []):
                cached_out = cached_job.get("output_data") or {}
                if cached_out.get("generation_hash") == gen_hash:
                    cached_essay_id = cached_out.get("essay_id")
                    if cached_essay_id:
                        logger.info(
                            f"WriterAgent: cache hit for student {student['id']} "
                            f"prompt {prompt_id} — reusing essay {cached_essay_id}"
                        )
                        db.table("agent_jobs").update({
                            "status": "completed",
                            "output_data": {
                                "essay_id": cached_essay_id,
                                "cache_hit": True,
                                "generation_hash": gen_hash,
                                "source_job_id": cached_job["id"],
                            },
                        }).eq("id", job_id).execute()
                        return

            draft = await self._generate_essay(student, prompt_text, prompt_type)
            # ── Strategy 3: Score is generated once per unique content ───
            score = await self._score_content(draft, prompt_text)
            word_count = len(draft.split())

            # Word count flags
            flags: list = []
            if word_count > word_limit_max:
                flags.append(f"⚠️ Over limit by {word_count - word_limit_max} words")
            elif word_limit_min > 0 and word_count < word_limit_min:
                flags.append(f"⚠️ Under minimum by {word_limit_min - word_count} words")
            flag_line = (
                "\n".join(flags) if flags else f"✅ {word_count} / {word_limit_max} words"
            )

            # Save draft to essays table
            essay_res = db.table("essays").insert({
                "agency_id": agency_id,
                "student_id": student["id"],
                "prompt_text": prompt_text,
                "content": draft,
                "word_count": word_count,
                "status": "draft",
                "ai_score": score,
                "version": 1,
            }).execute()

            essay_id = essay_res.data[0]["id"] if essay_res.data else None

            await write_audit_log(
                agency_id=agency_id,
                student_id=student["id"],
                action="essay.draft_generated",
                entity_type="essay",
                entity_id=essay_id,
                new_value={
                    "word_count": word_count,
                    "ai_score": score,
                    "prompt_id": prompt_id,
                    "word_limit_max": word_limit_max,
                },
            )

            header = (
                f"📝 *Essay Draft Ready*\n"
                f"Student: {student['full_name']}\n"
                f"Type: {prompt_type.replace('_', ' ').title()}\n"
                f"Words: {word_count} / {word_limit_max}\n"
                f"AI Score: {score}/100\n"
                f"{flag_line}\n"
                f"━━━━━━━━━━━━━━━\n"
                f"*Full Draft:*\n\n"
            )

            db.table("agent_jobs").update({
                "status": "awaiting_approval",
                "approval_message": header + draft[:400] + ("…" if len(draft) > 400 else ""),
                "output_data": {
                    "essay_id": essay_id,
                    "word_count": word_count,
                    "ai_score": score,
                    "prompt_id": prompt_id,
                    "word_limit_max": word_limit_max,
                    "generation_hash": gen_hash,   # Strategy 1: stored for future cache lookups
                },
            }).eq("id", job_id).execute()

            await self._send_full_approval(
                agency_id=agency_id,
                job_id=job_id,
                full_text=header + draft,
            )

        except Exception as exc:
            logger.error(f"WriterAgent essay generation failed: {exc}")
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": str(exc),
            }).eq("id", job_id).execute()

    # ------------------------------------------------------------------ #
    #  Recommendation letter                                               #
    # ------------------------------------------------------------------ #

    async def _run_rec_letter(
        self, student: dict, agency_id: str, recommender_id: str
    ) -> None:
        db = get_service_client()

        rec_res = db.table("recommenders").select(
            "id, name, title, subject, school, relationship"
        ).eq("id", recommender_id).eq("student_id", student["id"]).execute()

        if not rec_res.data:
            logger.error(
                f"WriterAgent: recommender {recommender_id} not found "
                f"for student {student['id']}"
            )
            return

        recommender = rec_res.data[0]

        job_res = db.table("agent_jobs").insert({
            "agency_id": agency_id,
            "student_id": student["id"],
            "agent_type": "writer",
            "job_type": "rec_letter",
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "requires_approval": True,
        }).execute()

        if not job_res.data:
            logger.error("WriterAgent: failed to create agent_job for rec_letter")
            return

        job_id = job_res.data[0]["id"]

        try:
            draft = await self._generate_rec_letter(student, recommender)
            word_count = len(draft.split())

            letter_res = db.table("recommendation_letters").insert({
                "agency_id": agency_id,
                "student_id": student["id"],
                "recommender_id": recommender["id"],
                "content": draft,
                "word_count": word_count,
                "status": "draft",
                "ai_generated": True,
            }).execute()

            letter_id = letter_res.data[0]["id"] if letter_res.data else None

            await write_audit_log(
                agency_id=agency_id,
                student_id=student["id"],
                action="rec_letter.draft_generated",
                entity_type="recommendation_letter",
                entity_id=letter_id,
                new_value={
                    "word_count": word_count,
                    "recommender_id": recommender_id,
                },
            )

            header = (
                f"📜 *Recommendation Letter Draft*\n"
                f"Student: {student['full_name']}\n"
                f"From: {recommender.get('name', 'Unknown')} "
                f"({recommender.get('title', '')})\n"
                f"Subject: {recommender.get('subject', 'N/A')}\n"
                f"Words: {word_count}\n"
                f"━━━━━━━━━━━━━━━\n"
                f"*Full Letter:*\n\n"
            )

            db.table("agent_jobs").update({
                "status": "awaiting_approval",
                "approval_message": header + draft[:400] + ("…" if len(draft) > 400 else ""),
                "output_data": {
                    "rec_letter_id": letter_id,
                    "recommender_id": recommender_id,
                    "word_count": word_count,
                },
            }).eq("id", job_id).execute()

            await self._send_full_approval(
                agency_id=agency_id,
                job_id=job_id,
                full_text=header + draft,
            )

        except Exception as exc:
            logger.error(f"WriterAgent rec_letter generation failed: {exc}")
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": str(exc),
            }).eq("id", job_id).execute()

    # ------------------------------------------------------------------ #
    #  Email reply draft                                                   #
    # ------------------------------------------------------------------ #

    async def _run_email_reply(
        self, student: dict, agency_id: str, email_id: str
    ) -> None:
        db = get_service_client()

        email_res = db.table("emails").select(
            "id, subject, body_text, from_address, category"
        ).eq("id", email_id).eq("student_id", student["id"]).execute()

        if not email_res.data:
            logger.error(
                f"WriterAgent: email {email_id} not found for student {student['id']}"
            )
            return

        email_record = email_res.data[0]

        job_res = db.table("agent_jobs").insert({
            "agency_id": agency_id,
            "student_id": student["id"],
            "agent_type": "writer",
            "job_type": "email_reply",
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "requires_approval": True,
        }).execute()

        if not job_res.data:
            logger.error("WriterAgent: failed to create agent_job for email_reply")
            return

        job_id = job_res.data[0]["id"]

        try:
            draft = await self._draft_email_reply(
                subject=email_record.get("subject", ""),
                body=email_record.get("body_text", ""),
                student=student,
            )

            db.table("emails").update({
                "ai_draft": draft,
                "draft_status": "pending_approval",
            }).eq("id", email_id).execute()

            await write_audit_log(
                agency_id=agency_id,
                student_id=student["id"],
                action="email.reply_drafted",
                entity_type="email",
                entity_id=email_id,
                new_value={"job_id": job_id, "draft_chars": len(draft)},
            )

            header = (
                f"✉️ *Email Reply Draft*\n"
                f"Student: {student['full_name']}\n"
                f"Re: {email_record.get('subject', '(no subject)')}\n"
                f"From: {email_record.get('from_address', '')}\n"
                f"━━━━━━━━━━━━━━━\n"
                f"*Draft Reply:*\n\n"
            )

            db.table("agent_jobs").update({
                "status": "awaiting_approval",
                "approval_message": header + draft[:400] + ("…" if len(draft) > 400 else ""),
                "output_data": {
                    "email_id": email_id,
                    "draft_chars": len(draft),
                },
            }).eq("id", job_id).execute()

            await self._send_full_approval(
                agency_id=agency_id,
                job_id=job_id,
                full_text=header + draft,
            )

        except Exception as exc:
            logger.error(f"WriterAgent email_reply draft failed: {exc}")
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": str(exc),
            }).eq("id", job_id).execute()

    # ------------------------------------------------------------------ #
    #  Approval / rejection handlers (called from telegram_bot callback)  #
    # ------------------------------------------------------------------ #

    async def approve_content(self, job_id: str) -> None:
        """
        Called after a 'writer' agent_job is approved via Telegram.
        Updates the underlying content entity to status=approved.
        """
        db = get_service_client()

        job_res = db.table("agent_jobs").select(
            "id, job_type, output_data, agency_id, student_id"
        ).eq("id", job_id).single().execute()

        if not job_res.data:
            logger.error(f"WriterAgent.approve_content: job {job_id} not found")
            return

        job = job_res.data
        output = job.get("output_data") or {}
        agency_id = job["agency_id"]
        student_id = job["student_id"]

        if job["job_type"] == "essay":
            essay_id = output.get("essay_id")
            if essay_id:
                db.table("essays").update({"status": "approved"}).eq(
                    "id", essay_id
                ).execute()
                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    action="essay.approved",
                    entity_type="essay",
                    entity_id=essay_id,
                    new_value={"job_id": job_id},
                )

        elif job["job_type"] == "rec_letter":
            letter_id = output.get("rec_letter_id")
            if letter_id:
                db.table("recommendation_letters").update({"status": "approved"}).eq(
                    "id", letter_id
                ).execute()
                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    action="rec_letter.approved",
                    entity_type="recommendation_letter",
                    entity_id=letter_id,
                    new_value={"job_id": job_id},
                )

        elif job["job_type"] == "email_reply":
            email_id = output.get("email_id")
            if email_id:
                db.table("emails").update({"draft_status": "approved"}).eq(
                    "id", email_id
                ).execute()
                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    action="email.reply_approved",
                    entity_type="email",
                    entity_id=email_id,
                    new_value={"job_id": job_id},
                )

    async def reject_content(self, job_id: str, reason: str) -> None:
        """
        Called after a 'writer' agent_job is rejected via Telegram.
        Sets content status=rejected and persists the rejection reason.
        """
        db = get_service_client()

        job_res = db.table("agent_jobs").select(
            "id, job_type, output_data, agency_id, student_id"
        ).eq("id", job_id).single().execute()

        if not job_res.data:
            logger.error(f"WriterAgent.reject_content: job {job_id} not found")
            return

        job = job_res.data
        output = job.get("output_data") or {}
        agency_id = job["agency_id"]
        student_id = job["student_id"]

        if job["job_type"] == "essay":
            essay_id = output.get("essay_id")
            if essay_id:
                db.table("essays").update({"status": "rejected"}).eq(
                    "id", essay_id
                ).execute()
                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    action="essay.rejected",
                    entity_type="essay",
                    entity_id=essay_id,
                    new_value={"job_id": job_id, "reason": reason},
                )

        elif job["job_type"] == "rec_letter":
            letter_id = output.get("rec_letter_id")
            if letter_id:
                db.table("recommendation_letters").update({"status": "rejected"}).eq(
                    "id", letter_id
                ).execute()
                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    action="rec_letter.rejected",
                    entity_type="recommendation_letter",
                    entity_id=letter_id,
                    new_value={"job_id": job_id, "reason": reason},
                )

        elif job["job_type"] == "email_reply":
            email_id = output.get("email_id")
            if email_id:
                db.table("emails").update({
                    "draft_status": "rejected",
                    "draft_rejection_reason": reason,
                }).eq("id", email_id).execute()
                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    action="email.reply_rejected",
                    entity_type="email",
                    entity_id=email_id,
                    new_value={"job_id": job_id, "reason": reason},
                )

    # ------------------------------------------------------------------ #
    #  Telegram delivery helper                                            #
    # ------------------------------------------------------------------ #

    async def _send_full_approval(
        self, agency_id: str, job_id: str, full_text: str
    ) -> None:
        """
        Sends the complete draft to Telegram.
        Text longer than _TG_MAX chars is split across multiple plain messages;
        the final chunk carries the approve / reject inline keyboard.
        """
        if len(full_text) <= _TG_MAX:
            await send_approval_request(
                agency_id=agency_id,
                job_id=job_id,
                message=full_text,
                screenshot_urls=[],
            )
            return

        chunks = [
            full_text[i : i + _TG_MAX] for i in range(0, len(full_text), _TG_MAX)
        ]
        for chunk in chunks[:-1]:
            await send_message_to_agency_staff(agency_id=agency_id, text=chunk)

        await send_approval_request(
            agency_id=agency_id,
            job_id=job_id,
            message=chunks[-1],
            screenshot_urls=[],
        )

    # ------------------------------------------------------------------ #
    #  LLM helpers                                                         #
    # ------------------------------------------------------------------ #

    async def _generate_essay(
        self, student: dict, prompt_text: str, prompt_type: str
    ) -> str:
        if prompt_type == "personal_statement":
            system = (
                load_soul("ESSAY_AGENT") + "\n\n"
                "Write the student's Common App personal statement entirely in their "
                "authentic first-person voice — specific, vivid, no clichés, no flowery openers. "
                "Tell one meaningful story. Stay within 650 words. "
                "Show, don't tell. End with reflection or insight."
            )
        else:
            system = (
                load_soul("ESSAY_AGENT") + "\n\n"
                "Write a compelling supplemental essay that answers the prompt directly. "
                "Be specific and authentic. Keep the voice natural and student-appropriate."
            )

        activities = student.get("activities") or []
        awards = student.get("awards") or []
        act_lines = (
            "\n".join(
                f"- {a.get('name', '')}: {a.get('description', '')}"
                for a in activities[:5]
            )
            or "Not specified"
        )
        award_lines = (
            "\n".join(f"- {a.get('name', '')}" for a in awards[:5]) or "Not specified"
        )

        user_msg = (
            f"Student Profile:\n"
            f"- Name: {student.get('full_name', '')}\n"
            f"- Nationality: {student.get('nationality', 'Not specified')}\n"
            f"- High School: {student.get('high_school_name', 'Not specified')}, "
            f"{student.get('high_school_country', '')}\n"
            f"- Graduation Year: {student.get('graduation_year', 'Not specified')}\n"
            f"- GPA: {student.get('gpa', 'N/A')} / {student.get('gpa_scale', 4.0)}\n"
            f"- Intended Major: {student.get('intended_major', 'Not specified')}\n"
            f"- SAT: {student.get('sat_total', 'Not taken')}\n\n"
            f"Activities:\n{act_lines}\n\n"
            f"Awards:\n{award_lines}\n\n"
            f"Essay Prompt:\n{prompt_text}\n\n"
            f"Write the complete essay now. Do not include a title or header."
        )

        response = await client.chat.completions.create(
            model=settings.AI_MODEL_FAST,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.85,
            max_tokens=1200,
        )
        return response.choices[0].message.content.strip()

    async def _score_content(self, content: str, prompt: str) -> int:
        """
        Score essay/letter quality 1-100. Returns integer only.
        Strategy 2: Uses _SCORE_SOUL (~80 tokens) instead of the full
        ESSAY_AGENT soul (~600 tokens) — saves ~520 tokens per scoring call.
        """
        response = await client.chat.completions.create(
            model=settings.AI_MODEL_FAST,
            messages=[
                {"role": "system", "content": _SCORE_SOUL},
                {
                    "role": "user",
                    "content": f"Prompt: {prompt}\n\nEssay:\n{content[:2000]}",
                },
            ],
            temperature=0,
            max_tokens=5,
        )
        raw = response.choices[0].message.content.strip()
        try:
            return max(1, min(100, int(raw)))
        except ValueError:
            return 70

    async def _generate_rec_letter(self, student: dict, recommender: dict) -> str:
        response = await client.chat.completions.create(
            model=settings.AI_MODEL_FAST,
            messages=[
                {
                    "role": "system",
                    "content": (
                        load_soul("ESSAY_AGENT") + "\n\n"
                        f"You are writing as {recommender.get('name', 'a teacher')}, "
                        f"a {recommender.get('title', 'teacher')} at "
                        f"{recommender.get('school', 'the school')}, "
                        f"composing a recommendation letter for a student you know as their "
                        f"{recommender.get('relationship', 'teacher')}. "
                        "Write a strong, specific letter of 400–600 words. "
                        "Be enthusiastic but credible. Include specific anecdotes. "
                        "Use proper letter format: greeting, body paragraphs, closing."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Student name: {student.get('full_name')}\n"
                        f"GPA: {student.get('gpa', 'N/A')} / {student.get('gpa_scale', 4.0)}\n"
                        f"Subject I teach: {recommender.get('subject', 'N/A')}\n"
                        f"Intended major: {student.get('intended_major', 'undecided')}\n\n"
                        "Write the recommendation letter now."
                    ),
                },
            ],
            temperature=0.8,
            max_tokens=900,
        )
        return response.choices[0].message.content.strip()

    async def _draft_email_reply(
        self, subject: str, body: str, student: dict
    ) -> str:
        response = await client.chat.completions.create(
            model=settings.AI_MODEL_FAST,
            messages=[
                {
                    "role": "system",
                    "content": (
                        load_soul("EMAIL_AGENT") + "\n\n"
                        f"Draft a professional email reply on behalf of student "
                        f"{student.get('full_name', 'the student')}. "
                        "Include a proper greeting and closing. "
                        "Do not include a subject line."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Original email:\nSubject: {subject}\n\n"
                        f"{body[:1500]}\n\nDraft a reply:"
                    ),
                },
            ],
            temperature=0.7,
            max_tokens=400,
        )
        return response.choices[0].message.content.strip()
