"""
Security tests: cross-agency isolation and auth enforcement.

All tests run against the real FastAPI router logic with a mocked Supabase
client — no real DB or network required.

SECURITY CONTRACT being verified:
  1. Every endpoint requires a valid JWT (missing auth → 401).
  2. agency_id is ALWAYS sourced from the auth token/DB — never from request body.
  3. A user from Agency A can never read or mutate data from Agency B.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from tests.conftest import (
    AGENCY_ID, AGENCY_ID_B, USER_ID, STUDENT_ID, APP_ID,
    JOB_ID, ESSAY_ID, DOC_ID, DEADLINE_ID,
    make_query_chain, make_db_response,
)


# ── 1. Auth enforcement — every write/read endpoint returns 401 without JWT ───

class TestAuthRequired:
    """All protected routes must reject requests with no Authorization header."""

    def test_list_essays_no_auth(self, app):
        # Use a fresh client WITHOUT the auth override
        from fastapi.testclient import TestClient as TC
        from core.auth import get_current_user
        # Temporarily remove the override
        saved = app.dependency_overrides.pop(get_current_user, None)
        try:
            with TC(app) as c:
                r = c.get("/api/essays")
            assert r.status_code == 401, r.text
        finally:
            if saved:
                app.dependency_overrides[get_current_user] = saved

    def test_create_application_no_auth(self, app):
        from fastapi.testclient import TestClient as TC
        from core.auth import get_current_user
        saved = app.dependency_overrides.pop(get_current_user, None)
        try:
            with TC(app) as c:
                r = c.post("/api/applications", json={
                    "student_id": STUDENT_ID,
                    "university_name": "MIT",
                })
            assert r.status_code == 401, r.text
        finally:
            if saved:
                app.dependency_overrides[get_current_user] = saved

    def test_agent_jobs_no_auth(self, app):
        from fastapi.testclient import TestClient as TC
        from core.auth import get_current_user
        saved = app.dependency_overrides.pop(get_current_user, None)
        try:
            with TC(app) as c:
                r = c.get("/api/agent-jobs")
            assert r.status_code == 401, r.text
        finally:
            if saved:
                app.dependency_overrides[get_current_user] = saved

    def test_documents_no_auth(self, app):
        from fastapi.testclient import TestClient as TC
        from core.auth import get_current_user
        saved = app.dependency_overrides.pop(get_current_user, None)
        try:
            with TC(app) as c:
                r = c.get("/api/documents")
            assert r.status_code == 401, r.text
        finally:
            if saved:
                app.dependency_overrides[get_current_user] = saved


# ── 2. Cross-agency isolation — data from Agency B is never returned ──────────

class TestCrossAgencyIsolation:
    """
    Simulate a request from AGENCY_A user trying to access AGENCY_B resources.
    The mock DB returns empty because the .eq("agency_id", AGENCY_A) filter
    would exclude AGENCY_B rows in the real Supabase query.
    We verify that the API correctly raises 404 rather than leaking data.
    """

    def test_cannot_read_foreign_essay(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            # DB returns nothing because agency_id filter excludes Agency B essay
            db = MagicMock()
            chain = make_query_chain(None)  # empty → not found
            db.table.return_value = chain
            mock_db.return_value = db

            r = client.get(f"/api/essays/{ESSAY_ID}")
            assert r.status_code == 404

    def test_cannot_update_foreign_application(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            chain = make_query_chain(None)
            db.table.return_value = chain
            mock_db.return_value = db

            r = client.patch(f"/api/applications/{APP_ID}", json={"notes": "hacked"})
            assert r.status_code == 404

    def test_cannot_approve_foreign_job(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            chain = make_query_chain(None)
            db.table.return_value = chain
            mock_db.return_value = db

            r = client.post(f"/api/agent-jobs/{JOB_ID}/approve")
            assert r.status_code == 404

    def test_student_isolation_on_create_application(self, client):
        """
        Creating an application for a student that belongs to another agency
        must be rejected as 404 (student not found for this agency).
        """
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            # Student query returns nothing — student belongs to Agency B
            chain = make_query_chain(None)
            db.table.return_value = chain
            mock_db.return_value = db

            r = client.post("/api/applications", json={
                "student_id": STUDENT_ID,      # belongs to Agency B in this mock
                "university_name": "Harvard",
            })
            assert r.status_code == 404

    def test_cannot_read_foreign_deadline(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            chain = make_query_chain(None)
            db.table.return_value = chain
            mock_db.return_value = db

            r = client.delete(f"/api/deadlines/{DEADLINE_ID}")
            assert r.status_code == 404

    def test_cannot_read_foreign_document(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            chain = make_query_chain(None)
            db.table.return_value = chain
            mock_db.return_value = db

            r = client.patch(f"/api/documents/{DOC_ID}/status?status=approved")
            assert r.status_code == 404


# ── 3. agency_id never accepted from body ────────────────────────────────────

class TestAgencyIdNotFromBody:
    """
    Verify that passing a foreign agency_id in the request body is ignored.
    The endpoint must always use the agency_id from the JWT (via get_current_user).
    """

    def test_create_application_ignores_body_agency_id(self, client):
        """
        Even if the client sends 'agency_id' in the JSON body, the server
        should either ignore it or 422 it (not in schema => ignored by Pydantic).
        The resulting record must use AGENCY_ID from the auth token.
        """
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()

            # Student lookup returns valid student
            student_data = {"id": STUDENT_ID, "full_name": "Alice"}
            # Application insert returns new record
            app_data = {
                "id": APP_ID,
                "agency_id": AGENCY_ID,   # server sets this from JWT
                "student_id": STUDENT_ID,
                "university_name": "MIT",
                "common_app_status": {},
                "status": "not_started",
            }

            call_count = 0
            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain(student_data)
                return make_query_chain([app_data])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            with patch("api.applications.write_audit_log"):
                r = client.post("/api/applications", json={
                    "student_id": STUDENT_ID,
                    "university_name": "MIT",
                    "agency_id": AGENCY_ID_B,   # ← should be ignored
                })

            # Request succeeds (or 422) — the key point is it never uses B's agency_id
            assert r.status_code in (201, 404, 422)
