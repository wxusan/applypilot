from typing import Union, Optional
"""
Shared pytest fixtures for ApplyPilot backend tests.

All Supabase DB calls are mocked — no real DB or network needed.
Auth is bypassed by overriding the get_current_user dependency.
"""

import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# ── Set test env vars BEFORE any module imports that read settings ────────────
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "super-secret-test-jwt-key-32bytes!!")
os.environ.setdefault("ENCRYPTION_KEY", "WmFsT2RNakc2c0xaNHNpWVhQZ21hRVBkc2tyak10UHM=")  # valid Fernet key
os.environ.setdefault("OPENAI_API_KEY", "sk-test-key")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "1234567890:test-token")
os.environ.setdefault("CLOUDFLARE_R2_ACCOUNT_ID", "test-account")
os.environ.setdefault("CLOUDFLARE_R2_ACCESS_KEY_ID", "test-key-id")
os.environ.setdefault("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "test-secret")
os.environ.setdefault("CLOUDFLARE_R2_BUCKET_NAME", "test-bucket")


# ── Canonical fake data ───────────────────────────────────────────────────────

AGENCY_ID   = "agency-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
AGENCY_ID_B = "agency-bbbb-bbbb-bbbb-bbbbbbbbbbbb"   # foreign agency (for isolation tests)
USER_ID     = "user-1111-1111-1111-111111111111"
STUDENT_ID  = "stud-2222-2222-2222-222222222222"
APP_ID      = "appl-3333-3333-3333-333333333333"
JOB_ID      = "job--4444-4444-4444-444444444444"
ESSAY_ID    = "essa-5555-5555-5555-555555555555"
DOC_ID      = "docu-6666-6666-6666-666666666666"
DEADLINE_ID = "dead-7777-7777-7777-777777777777"


# ── Auth mock ─────────────────────────────────────────────────────────────────

from models.user import AuthUser  # noqa: E402  (imported after env vars set)

FAKE_USER = AuthUser(
    id=USER_ID,
    email="staff@agency.com",
    full_name="Test Staff",
    role="admin",
    agency_id=AGENCY_ID,
    telegram_chat_id=None,
)


def _override_get_current_user():
    """FastAPI dependency override — returns a pre-built AuthUser, no JWT needed."""
    return FAKE_USER


# ── App client fixture ────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def app():
    """Create FastAPI app with auth dependency overridden."""
    from main import app as _app
    from core.auth import get_current_user
    _app.dependency_overrides[get_current_user] = _override_get_current_user
    return _app


@pytest.fixture(scope="session")
def client(app):
    """Synchronous TestClient wrapping the FastAPI app."""
    with TestClient(app) as c:
        yield c


# ── Mock DB builder ───────────────────────────────────────────────────────────

def make_db_response(data: Union[list, dict, None], count: Optional[int] = None):
    """Build a fake Supabase result object.  result.data = data, result.count = count."""
    result = MagicMock()
    result.data = data if data is not None else []
    result.count = count
    return result


def make_query_chain(final_data: Union[list, dict, None], count: Optional[int] = None):
    """
    Returns a MagicMock that supports unlimited chaining of Supabase builder
    methods (.select, .eq, .order, .single, .range …) and ends with
    .execute() returning make_db_response(final_data).
    """
    response = make_db_response(final_data, count)
    chain    = MagicMock()
    chain.execute.return_value = response
    # Make every chained method return the same object so we can write:
    #   db.table(x).select(y).eq(z).single().execute()
    for method in ("select", "eq", "neq", "order", "single", "range",
                   "insert", "update", "delete", "upsert", "limit"):
        getattr(chain, method).return_value = chain
    return chain
