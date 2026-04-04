"""
Chat API — AI chatbot with real-time SSE streaming.
Scoped to agency; optionally tied to a student for context injection.

Endpoints:
  POST /api/chat/conversations          — create a conversation
  GET  /api/chat/conversations          — list conversations (optional ?student_id=)
  GET  /api/chat/conversations/{id}/messages — get message history
  POST /api/chat/conversations/{id}/messages — send a message (returns SSE stream)

Architecture reference: Section 10.3 (Chatbot Technical Implementation)
"""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from core.auth import get_current_user
from core.db import get_service_client
from core.config import settings
from models.user import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"], prefix="/chat")


# ─── Pydantic models ─────────────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    student_id: Optional[str] = None
    title: Optional[str] = Field(default=None, max_length=200)


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


# ─── Helper: build student context string ────────────────────────────────────

def _build_student_context(student: dict) -> str:
    """Serialize key student fields into a concise context block for the AI."""
    name = student.get("full_name") or ""
    parts = [f"Student: {name}"] if name else []
    if student.get("gpa"):
        parts.append(f"GPA: {student['gpa']}")
    if student.get("sat_total"):
        parts.append(f"SAT: {student['sat_total']}")
    if student.get("intended_major"):
        parts.append(f"Target Major: {student['intended_major']}")
    if student.get("graduation_year"):
        parts.append(f"Graduation Year: {student['graduation_year']}")
    if student.get("nationality"):
        parts.append(f"Nationality: {student['nationality']}")
    if student.get("high_school_name"):
        parts.append(f"School: {student['high_school_name']}")
    return " | ".join(parts)


# ─── Helper: SSE generator ───────────────────────────────────────────────────

async def _stream_openai(messages: list[dict], conversation_id: str, agency_id: str) -> AsyncIterator[str]:
    """
    Stream an OpenAI response as SSE chunks.
    Saves the complete response to chat_messages table when done.
    """
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    accumulated = ""
    try:
        stream = await client.chat.completions.create(
            model=settings.AI_MODEL_FAST,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
            stream=True,
        )
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta.content
            if delta:
                accumulated += delta
                yield f"data: {json.dumps({'type': 'delta', 'content': delta})}\n\n"
    except Exception as e:
        logger.error(f"[chat] OpenAI streaming error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        return

    # Persist the assistant message
    if accumulated:
        try:
            db = get_service_client()
            db.table("chat_messages").insert({
                "conversation_id": conversation_id,
                "agency_id": agency_id,
                "role": "assistant",
                "content": accumulated,
            }).execute()
        except Exception as e:
            logger.warning(f"[chat] Failed to persist assistant message: {e}")

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/conversations", status_code=201)
async def create_conversation(
    body: CreateConversationRequest,
    user: AuthUser = Depends(get_current_user),
):
    """Create a new chat conversation, optionally tied to a student."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()

    # Resolve title from student name if not provided
    title = body.title
    if not title and body.student_id:
        student = db.table("students").select("full_name").eq("id", body.student_id).maybe_single().execute()
        if student.data:
            title = f"Chat: {student.data['full_name']}"

    result = db.table("chat_conversations").insert({
        "agency_id": user.agency_id,
        "user_id": user.id,
        "student_id": body.student_id,
        "title": title or "New Conversation",
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to create conversation")
    return result.data[0]


@router.get("/conversations")
async def list_conversations(
    student_id: Optional[str] = None,
    user: AuthUser = Depends(get_current_user),
):
    """List conversations for this agency, optionally filtered by student."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    query = (
        db.table("chat_conversations")
        .select("*")
        .eq("agency_id", user.agency_id)
        .order("created_at", desc=True)
        .limit(50)
    )
    if student_id:
        query = query.eq("student_id", student_id)

    result = query.execute()
    return result.data or []


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Get message history for a conversation."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()

    # Verify conversation belongs to this agency
    conv = (
        db.table("chat_conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("agency_id", user.agency_id)
        .maybe_single()
        .execute()
    )
    if not conv.data:
        raise HTTPException(404, "Conversation not found")

    messages = (
        db.table("chat_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    return messages.data or []


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    user: AuthUser = Depends(get_current_user),
):
    """
    Send a user message and stream the AI response as SSE.

    Response: text/event-stream
      data: {"type": "delta", "content": "..."}  — streamed tokens
      data: {"type": "done"}                      — end of stream
      data: {"type": "error", "message": "..."}   — on failure
    """
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()

    # Verify conversation
    conv = (
        db.table("chat_conversations")
        .select("*, students(*)")
        .eq("id", conversation_id)
        .eq("agency_id", user.agency_id)
        .maybe_single()
        .execute()
    )
    if not conv.data:
        raise HTTPException(404, "Conversation not found")

    # Persist user message
    db.table("chat_messages").insert({
        "conversation_id": conversation_id,
        "agency_id": user.agency_id,
        "role": "user",
        "content": body.content,
    }).execute()

    # Fetch recent history (last 20 messages for context window)
    history = (
        db.table("chat_messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .limit(20)
        .execute()
    )

    # Build system prompt — inject student context if available
    system_parts = [
        "You are ApplyPilot, an expert AI assistant for college application counselors. "
        "You help counselors manage students, review essays, track deadlines, and make "
        "strategic decisions about college applications. Be concise, professional, and accurate.",
    ]
    student = conv.data.get("students")
    if student:
        context = _build_student_context(student)
        system_parts.append(f"\nStudent context: {context}")

    messages = [{"role": "system", "content": " ".join(system_parts)}]
    for msg in (history.data or []):
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Stream response
    return StreamingResponse(
        _stream_openai(messages, conversation_id, user.agency_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
