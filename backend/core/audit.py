"""
Audit log writer. Every action by every agent and every user
must be written here before returning a response.
"""

from core.db import get_service_client
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


async def write_audit_log(
    *,
    agency_id: str,
    user_id: Optional[str] = None,
    student_id: Optional[str] = None,
    application_id: Optional[str] = None,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Write an audit log entry. Silently fails on error — never blocks the main operation."""
    try:
        db = get_service_client()
        db.table("audit_logs").insert({
            "agency_id": agency_id,
            "user_id": user_id,
            "student_id": student_id,
            "application_id": application_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "old_value": old_value,
            "new_value": new_value,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }).execute()
    except Exception as e:
        logger.error(f"Audit log write failed: {e}")
