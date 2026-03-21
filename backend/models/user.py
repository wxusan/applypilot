from pydantic import BaseModel
from typing import Optional


class AuthUser(BaseModel):
    """Authenticated user — populated by JWT + DB lookup. Never from request params."""
    id: str
    email: str
    full_name: str
    role: str
    agency_id: Optional[str] = None  # ALWAYS from DB — Never from token (None for super_admins)
    telegram_chat_id: Optional[str] = None
