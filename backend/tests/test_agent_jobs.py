"""
Integration tests: /api/agent-jobs endpoints
"""

import pytest
from unittest.mock import patch, MagicMock

from tests.conftest import (
    AGENCY_ID, USER_ID, STUDENT_ID, JOB_ID,
    make_query_chain,
)

JOB_ROW = {
    "id": JOB_ID,
    "agency_id": AGENCY_ID,
    "student_id": STUDENT_ID,
    "agent_type": "writer",
    "job_type": "essay_generation",
    "status": "awaiting_approval",
    "requires_approval": True,
    "approval_message": "Essay draft ready",
    "created_at": "2024-01-01T00:00:00Z",
}


class TestListAgentJobs:
    def test_returns_jobs_list(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            chain = make_query_chain([JOB_ROW], count=1)
            db.table.return_value = chain
            mock_db.return_value = db

            r = client.get("/api/agent-jobs")
            assert r.status_code == 200
            body = r.json()
            assert "jobs" in body
            assert "total" in body

    def test_filter_by_status(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([JOB_ROW], count=1)
            mock_db.return_value = db

            r = client.get("/api/agent-jobs?status=awaiting_approval")
            assert r.status_code == 200


class TestGetAgentJob:
    def test_found(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(JOB_ROW)
            mock_db.return_value = db

            r = client.get(f"/api/agent-jobs/{JOB_ID}")
            assert r.status_code == 200
            assert r.json()["id"] == JOB_ID

    def test_not_found_404(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.get("/api/agent-jobs/nonexistent")
            assert r.status_code == 404


class TestApproveJob:
    def test_approve_awaiting_job(self, client):
        approved = {**JOB_ROW, "status": "approved"}
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain(JOB_ROW)
                return make_query_chain([approved])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post(f"/api/agent-jobs/{JOB_ID}/approve")
            assert r.status_code == 200

    def test_cannot_approve_non_awaiting_job(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain({**JOB_ROW, "status": "completed"})
            mock_db.return_value = db

            r = client.post(f"/api/agent-jobs/{JOB_ID}/approve")
            assert r.status_code == 400

    def test_not_found_404(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post("/api/agent-jobs/nonexistent/approve")
            assert r.status_code == 404


class TestRejectJob:
    def test_rejects_job(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db, \
             patch("api.agent_jobs.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain({**JOB_ROW, "id": JOB_ID, "status": "awaiting_approval"})
                return make_query_chain([{**JOB_ROW, "status": "rejected"}])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post(f"/api/agent-jobs/{JOB_ID}/reject", json={"reason": "Not good enough"})
            assert r.status_code == 200

    def test_missing_reason_422(self, client):
        r = client.post(f"/api/agent-jobs/{JOB_ID}/reject", json={})
        assert r.status_code == 422

    def test_not_found_returns_gracefully(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db, \
             patch("api.agent_jobs.write_audit_log"):
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post("/api/agent-jobs/nonexistent/reject", json={"reason": "N/A"})
            assert r.status_code == 404
