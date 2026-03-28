"""
Notifications API — persistent in-app notifications for agency staff.
Architecture reference: Section 14.4

Endpoints:
  GET  /api/notifications                  — list notifications for current user
  GET  /api/notifications/unread-count     — count of unread notifications
  POST /api/notifications/{id}/read        — mark one notification as read
  POST /api/notifications/read-all         — mark all notifications as read
  POST /api/notifications                  — create a notification (internal/admin use)
  DELETE /api/notifications/{id}           — delete a notification
"""

from __future__ import annotations

import logging
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Notifications"], prefix="/notifications")


# ─── Pydantic models ─────────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    title: str
    body: str
    type: str = "info"          # info | warning | error | success | deadline | approval
    user_id: Optional[str] = None   # None = broadcast to all agency members
    metadata: Optional[dict] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/unread-count")
async def get_unread_count(
    user: AuthUser = Depends(get_current_user),
):
    """Return count of unread notifications for the current user."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    result = (
        db.table("notifications")
        .select("id", count="exact")
        .eq("agency_id", user.agency_id)
        .eq("is_read", False)
        .or_(f"user_id.is.null,user_id.eq.{user.id}")
        .execute()
    )
    return {"count": result.count or 0}


@router.get("/")
async def list_notifications(
    limit: int = 50,
    unread_only: bool = False,
    user: AuthUser = Depends(get_current_user),
):
    """List notifications for the current user (own + broadcasts)."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    query = (
        db.table("notifications")
        .select("*")
        .eq("agency_id", user.agency_id)
        .or_(f"user_id.is.null,user_id.eq.{user.id}")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if unread_only:
        query = query.eq("is_read", False)

    return query.execute().data or []


@router.post("/", status_code=201)
async def create_notification(
    body: NotificationCreate,
    user: AuthUser = Depends(get_current_user),
):
    """Create a notification (for agency staff / system triggers)."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    payload = {
        "agency_id": user.agency_id,
        "title": body.title,
        "body": body.body,
        "type": body.type,
    }
    if body.user_id:
        payload["user_id"] = body.user_id
    if body.metadata:
        payload["metadata"] = body.metadata

    result = db.table("notifications").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create notification")
    return result.data[0]


@router.post("/read-all", status_code=200)
async def mark_all_read(
    user: AuthUser = Depends(get_current_user),
):
    """Mark all unread notifications as read for the current user."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()
    db.table("notifications").update({"is_read": True}).eq(
        "agency_id", user.agency_id
    ).or_(f"user_id.is.null,user_id.eq.{user.id}").eq("is_read", False).execute()

    return {"success": True}


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Mark a single notification as read."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()

    # Verify the notification belongs to this user/agency
    notif = (
        db.table("notifications")
        .select("*")
        .eq("id", notification_id)
        .eq("agency_id", user.agency_id)
        .or_(f"user_id.is.null,user_id.eq.{user.id}")
        .maybe_single()
        .execute()
    )
    if not notif.data:
        raise HTTPException(404, "Notification not found")

    result = (
        db.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .execute()
    )
    return result.data[0] if result.data else {**notif.data, "is_read": True}


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Delete a notification."""
    if not user.agency_id:
        raise HTTPException(403, "Agency context required")

    db = get_service_client()

    notif = (
        db.table("notifications")
        .select("id")
        .eq("id", notification_id)
        .eq("agency_id", user.agency_id)
        .or_(f"user_id.is.null,user_id.eq.{user.id}")
        .maybe_single()
        .execute()
    )
    if not notif.data:
        raise HTTPException(404, "Notification not found")

    db.table("notifications").delete().eq("id", notification_id).execute()
