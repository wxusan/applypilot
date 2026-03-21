"""
Audit log read API.
Returns audit trail for a student or the whole agency.
Write-only from core/audit.py — this router is read-only.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Audit"])


@router.get("/audit-logs")
async def list_audit_logs(
    student_id: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user: AuthUser = Depends(get_current_user),
):
    db = get_service_client()

    query = (
        db.table("audit_logs")
        .select(
            "id, user_id, student_id, application_id, action, "
            "entity_type, entity_id, old_value, new_value, "
            "ip_address, created_at, "
            "actor:users!user_id(full_name)",
            count="exact",
        )
        .eq("agency_id", user.agency_id)  # ISOLATION
    )

    if student_id:
        query = query.eq("student_id", student_id)
    if entity_type:
        query = query.eq("entity_type", entity_type)

    result = (
        query.order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {"logs": result.data or [], "total": result.count or 0}
