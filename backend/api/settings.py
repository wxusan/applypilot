import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from core.auth import get_current_user, require_admin
from core.db import get_service_client
from core.audit import write_audit_log
from models.user import AuthUser
from services.storage import upload_bytes_to_r2

router = APIRouter(tags=["Settings"])


class ProfileUpdate(BaseModel):
    telegram_chat_id: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None


class AgencyUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None


@router.patch("/settings/profile")
async def update_profile(
    data: ProfileUpdate,
    request: Request,
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if not payload:
        return {"message": "No changes"}

    result = db.table("users").update(payload).eq("id", user.id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="user.profile_updated",
        entity_type="user",
        entity_id=user.id,
        new_value=payload,
        ip_address=request.client.host if request.client else None,
    )

    return result.data[0]


@router.patch("/settings/agency")
async def update_agency(
    data: AgencyUpdate,
    request: Request,
    user: AuthUser = Depends(require_admin),
):
    db = get_service_client()

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if not payload:
        return {"message": "No changes"}

    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = db.table("agencies").update(payload).eq("id", user.agency_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="agency.updated",
        entity_type="agency",
        entity_id=user.agency_id,
        new_value=payload,
        ip_address=request.client.host if request.client else None,
    )

    return result.data[0]


@router.post("/settings/agency/logo")
async def upload_agency_logo(
    request: Request,
    file: UploadFile = File(...),
    user: AuthUser = Depends(require_admin),
):
    """Upload agency logo to R2 and return the public URL."""
    ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/svg+xml"}
    MAX_SIZE = 2 * 1024 * 1024  # 2 MB

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PNG, JPG, WebP, or SVG.")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 2 MB.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "png"
    key = f"{user.agency_id}/logos/logo_{uuid.uuid4().hex[:8]}.{ext}"

    url = await upload_bytes_to_r2(key, content, file.content_type or "image/png")

    db = get_service_client()
    db.table("agencies").update({
        "logo_url": url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", user.agency_id).execute()

    await write_audit_log(
        agency_id=user.agency_id,
        user_id=user.id,
        action="agency.logo_uploaded",
        entity_type="agency",
        entity_id=user.agency_id,
        new_value={"logo_url": url},
        ip_address=request.client.host if request.client else None,
    )

    return {"url": url}


@router.patch("/users/me/accept-terms")
async def accept_terms(user: AuthUser = Depends(get_current_user)):
    """Mark the current user as having accepted the Terms of Service."""
    db = get_service_client()
    now = datetime.now(timezone.utc).isoformat()
    db.table("users").update({"terms_accepted_at": now}).eq("id", user.id).execute()
    return {"terms_accepted_at": now}
