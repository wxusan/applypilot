"""
JWT authentication + agency_id injection.

SECURITY CONTRACT:
- agency_id is ALWAYS extracted from the JWT token only.
- It is NEVER accepted from request body, query params, or headers.
- Every request that touches tenant data goes through get_current_user().
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import settings
from core.db import get_service_client
from models.user import AuthUser
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


def _get_user_id_from_token(token: str) -> str:
    """
    Verify a Supabase JWT using Supabase's own admin API.
    Returns the user_id (sub) on success, raises 401 on failure.
    """
    db = get_service_client()
    try:
        response = db.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return response.user.id
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[auth] get_user failed: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {type(e).__name__}: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthUser:
    """
    Dependency that:
    1. Validates the JWT via Supabase admin API
    2. Looks up the user in agency_members
    3. Returns AuthUser with agency_id baked in from the DB — not from the token
    """
    user_id = _get_user_id_from_token(credentials.credentials)

    db = get_service_client()

    # Fetch user + agency membership — agency_id comes ONLY from here
    result = db.table("agency_members").select(
        "agency_id, role, is_active, user:users(id, email, full_name, role, telegram_chat_id)"
    ).eq("user_id", user_id).eq("is_active", True).single().execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of any active agency",
        )

    member = result.data
    user_data = member["user"] if isinstance(member["user"], dict) else member["user"][0]

    # Update last_active_at (best-effort, fire-and-forget)
    try:
        db.table("users").update({"last_active_at": "now()"}).eq("id", user_id).execute()
    except Exception:
        pass

    return AuthUser(
        id=user_id,
        email=user_data["email"],
        full_name=user_data["full_name"],
        role=member["role"],
        agency_id=member["agency_id"],  # sourced from DB — NEVER from token/params
        telegram_chat_id=user_data.get("telegram_chat_id"),
    )


def require_admin(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    """Require the current user to be an agency admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def get_super_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthUser:
    """Require the current user to be a global super_admin."""
    user_id = _get_user_id_from_token(credentials.credentials)

    db = get_service_client()
    result = db.table("users").select("id, email, full_name, role, telegram_chat_id").eq("id", user_id).single().execute()

    if not result.data or result.data.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required",
        )

    user_data = result.data
    return AuthUser(
        id=user_id,
        email=user_data["email"],
        full_name=user_data["full_name"],
        role=user_data["role"],
        agency_id=None,
        telegram_chat_id=user_data.get("telegram_chat_id"),
    )
