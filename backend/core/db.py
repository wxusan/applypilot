"""
Database client factory.
Always uses the SERVICE KEY for backend operations (bypasses RLS).
RLS is enforced at the policy level as a defence-in-depth measure, but the
primary isolation guarantee is the agency_id filter injected by get_current_user().
"""

from supabase import create_client, Client
from core.config import settings
from functools import lru_cache


@lru_cache(maxsize=1)
def get_service_client() -> Client:
    """Supabase client with service-role key — bypasses RLS."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
