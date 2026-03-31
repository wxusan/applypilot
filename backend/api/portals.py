"""
Portals API — Phase 4G
Tracks university application portal sessions.

Endpoints:
  GET  /api/portals?student_id=           — list portal sessions
  POST /api/portals                       — create portal entry (manual or from email monitor)
  PATCH /api/portals/{id}                 — update portal status
  POST /api/portals/{id}/activate         — trigger portal activation (stub for agent)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Portals"])


class PortalCreate(BaseModel):
    student_id: str
    university_name: str
    portal_url: Optional[str] = None
    portal_pin: Optional[str] = None


class PortalUpdate(BaseModel):
    activation_status: Optional[str] = None
    missing_documents: Optional[List[str]] = None
    uploaded_documents: Optional[List[str]] = None
    decision_status: Optional[str] = None
    decision_url: Optional[str] = None


@router.get("/portals")
async def list_portals(student_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    result = db.table("portal_sessions")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("agency_id", user.agency_id)\
        .order("created_at", desc=True)\
        .execute()
    return result.data or []


@router.post("/portals")
async def create_portal(body: PortalCreate, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    student = db.table("students").select("id, agency_id").eq("id", body.student_id).eq("agency_id", user.agency_id).single().execute()
    if not student.data:
        raise HTTPException(404, "Student not found")

    payload = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "agency_id": user.agency_id,
        "university_name": body.university_name,
        "portal_url": body.portal_url,
        "portal_pin": body.portal_pin,
        "activation_status": "not_started",
        "missing_documents": [],
        "uploaded_documents": [],
        "decision_status": "pending",
    }
    result = db.table("portal_sessions").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create portal")
    return result.data[0]


@router.patch("/portals/{portal_id}")
async def update_portal(portal_id: str, body: PortalUpdate, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    portal = db.table("portal_sessions").select("id, agency_id").eq("id", portal_id).eq("agency_id", user.agency_id).single().execute()
    if not portal.data:
        raise HTTPException(404, "Portal not found")
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        return portal.data
    result = db.table("portal_sessions").update(updates).eq("id", portal_id).execute()
    return result.data[0]


@router.post("/portals/{portal_id}/activate")
async def activate_portal(portal_id: str, user: AuthUser = Depends(get_current_user)):
    """Trigger portal activation via automation agent. Stub until Phase 4G agent is live."""
    db = get_service_client()
    portal = db.table("portal_sessions").select("*").eq("id", portal_id).eq("agency_id", user.agency_id).single().execute()
    if not portal.data:
        raise HTTPException(404, "Portal not found")
    # Phase 4G will trigger portal_agent here
    db.table("portal_sessions").update({"last_checked_at": datetime.now(timezone.utc).isoformat()}).eq("id", portal_id).execute()
    return {"success": True, "message": "Portal activation queued. Agent will process shortly."}
