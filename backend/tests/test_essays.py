"""
Integration tests: /api/essays endpoints
Full request→response cycle with mocked Supabase client.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from tests.conftest import (
    AGENCY_ID, USER_ID, STUDENT_ID, APP_ID, JOB_ID, ESSAY_ID,
    make_query_chain,
)

ESSAY_ROW = {
    "id": ESSAY_ID,
    "agency_id": AGENCY_ID,
    "student_id": STUDENT_ID,
    "application_id": APP_ID,
    "prompt_text": "Why us?",
    "content": "I have always dreamed...",
    "word_count": 5,
    "status": "draft",
    "ai_score": 82,
    "version": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
}

STUDENT_ROW = {
    "id": STUDENT_ID,
    "full_name": "Alice Smith",
    "agency_id": AGENCY_ID,
}

JOB_ROW = {
    "id": JOB_ID,
    "agency_id": AGENCY_ID,
    "student_id": STUDENT_ID,
    "agent_type": "writer",
    "job_type": "essay_generation",
    "status": "pending",
    "requires_approval": True,
}


class TestListEssays:
    def test_returns_essay_list(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([ESSAY_ROW])
            mock_db.return_value = db

            r = client.get("/api/essays")
            assert r.status_code == 200
            body = r.json()
            assert "essays" in body
            assert len(body["essays"]) == 1

    def test_filters_by_student_id(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([ESSAY_ROW])
            mock_db.return_value = db

            r = client.get(f"/api/essays?student_id={STUDENT_ID}")
            assert r.status_code == 200

    def test_empty_list_ok(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([])
            mock_db.return_value = db

            r = client.get("/api/essays")
            assert r.status_code == 200
            assert r.json()["essays"] == []


class TestGetEssay:
    def test_found(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(ESSAY_ROW)
            mock_db.return_value = db

            r = client.get(f"/api/essays/{ESSAY_ID}")
            assert r.status_code == 200
            assert r.json()["id"] == ESSAY_ID

    def test_not_found(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.get(f"/api/essays/nonexistent")
            assert r.status_code == 404


class TestGenerateEssay:
    def test_returns_202_with_job_id(self, client):
        with patch("api.essays.get_service_client") as mock_db, \
             patch("api.essays.write_audit_log"):

            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain(STUDENT_ROW)
                return make_query_chain([JOB_ROW])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post("/api/essays/generate", json={
                "student_id": STUDENT_ID,
                "prompt_text": "Tell us about yourself.",
                "prompt_type": "personal_statement",
            })

            assert r.status_code == 202
            body = r.json()
            assert "job_id" in body
            assert body["status"] == "pending"

    def test_student_not_found_returns_404(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post("/api/essays/generate", json={
                "student_id": "nonexistent",
                "prompt_text": "Tell us about yourself.",
                "prompt_type": "personal_statement",
            })
            assert r.status_code == 404

    def test_missing_prompt_text_422(self, client):
        r = client.post("/api/essays/generate", json={"student_id": STUDENT_ID})
        assert r.status_code == 422


class TestUpdateEssay:
    def test_updates_content_and_word_count(self, client):
        updated = {**ESSAY_ROW, "content": "New draft text", "word_count": 3}
        with patch("api.essays.get_service_client") as mock_db, \
             patch("api.essays.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain(ESSAY_ROW)
                return make_query_chain([updated])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.patch(f"/api/essays/{ESSAY_ID}", json={"content": "New draft text"})
            assert r.status_code == 200

    def test_not_found_404(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.patch(f"/api/essays/nonexistent", json={"status": "approved"})
            assert r.status_code == 404


class TestApproveEssay:
    def test_approve_returns_200(self, client):
        approved = {**ESSAY_ROW, "status": "approved"}
        with patch("api.essays.get_service_client") as mock_db, \
             patch("api.essays.write_audit_log"):
            db = MagicMock()
            db.table.return_value = make_query_chain([approved])
            mock_db.return_value = db

            r = client.post(f"/api/essays/{ESSAY_ID}/approve")
            assert r.status_code == 200
            assert r.json()["status"] == "approved"

    def test_approve_not_found_404(self, client):
        with patch("api.essays.get_service_client") as mock_db, \
             patch("api.essays.write_audit_log"):
            db = MagicMock()
            db.table.return_value = make_query_chain([])
            mock_db.return_value = db

            r = client.post(f"/api/essays/nonexistent/approve")
            assert r.status_code == 404
