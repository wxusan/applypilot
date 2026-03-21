"""
Integration tests: /api/deadlines endpoints
"""

import pytest
from unittest.mock import patch, MagicMock

from tests.conftest import (
    AGENCY_ID, STUDENT_ID, APP_ID, DEADLINE_ID,
    make_query_chain,
)

DEADLINE_ROW = {
    "id": DEADLINE_ID,
    "agency_id": AGENCY_ID,
    "student_id": STUDENT_ID,
    "application_id": APP_ID,
    "title": "Common App Deadline",
    "type": "application",
    "due_date": "2025-01-01",
    "due_time": "23:59",
    "timezone": "Asia/Tashkent",
    "alert_days_before": [30, 14, 7, 3, 1],
    "is_complete": False,
    "completed_at": None,
    "created_at": "2024-01-01T00:00:00Z",
}


class TestListDeadlines:
    def test_returns_deadline_list(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([DEADLINE_ROW])
            mock_db.return_value = db

            r = client.get("/api/deadlines")
            assert r.status_code == 200
            assert "deadlines" in r.json()

    def test_filter_upcoming_only(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([DEADLINE_ROW])
            mock_db.return_value = db

            r = client.get("/api/deadlines?upcoming_only=true")
            assert r.status_code == 200


class TestCreateDeadline:
    def test_creates_successfully(self, client):
        with patch("api.deadlines.get_service_client") as mock_db, \
             patch("api.deadlines.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain({"id": STUDENT_ID})
                return make_query_chain([DEADLINE_ROW])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post("/api/deadlines", json={
                "student_id": STUDENT_ID,
                "title": "Common App Deadline",
                "due_date": "2025-01-01",
            })
            assert r.status_code == 201

    def test_missing_due_date_422(self, client):
        r = client.post("/api/deadlines", json={
            "student_id": STUDENT_ID,
            "title": "Test",
        })
        assert r.status_code == 422

    def test_student_not_found_404(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post("/api/deadlines", json={
                "student_id": "nonexistent",
                "title": "Test",
                "due_date": "2025-01-01",
            })
            assert r.status_code == 404


class TestUpdateDeadline:
    def test_updates_title(self, client):
        updated = {**DEADLINE_ROW, "title": "Updated Title"}
        with patch("api.deadlines.get_service_client") as mock_db, \
             patch("api.deadlines.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(DEADLINE_ROW if call_count == 1 else [updated])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.patch(f"/api/deadlines/{DEADLINE_ID}", json={"title": "Updated Title"})
            assert r.status_code == 200

    def test_not_found_404(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.patch("/api/deadlines/nope", json={"title": "x"})
            assert r.status_code == 404

    def test_no_op_returns_existing(self, client):
        """PATCH with empty body returns existing record without hitting DB update."""
        with patch("api.deadlines.get_service_client") as mock_db, \
             patch("api.deadlines.write_audit_log"):
            db = MagicMock()
            db.table.return_value = make_query_chain(DEADLINE_ROW)
            mock_db.return_value = db

            r = client.patch(f"/api/deadlines/{DEADLINE_ID}", json={})
            assert r.status_code == 200


class TestCompleteDeadline:
    def test_marks_complete(self, client):
        completed = {**DEADLINE_ROW, "is_complete": True, "completed_at": "2024-06-01T00:00:00Z"}
        with patch("api.deadlines.get_service_client") as mock_db, \
             patch("api.deadlines.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(DEADLINE_ROW if call_count == 1 else [completed])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post(f"/api/deadlines/{DEADLINE_ID}/complete")
            assert r.status_code == 200

    def test_not_found_404(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post("/api/deadlines/nope/complete")
            assert r.status_code == 404


class TestUncompleteDeadline:
    def test_marks_incomplete(self, client):
        uncompleted = {**DEADLINE_ROW, "is_complete": False, "completed_at": None}
        with patch("api.deadlines.get_service_client") as mock_db, \
             patch("api.deadlines.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(
                    {**DEADLINE_ROW, "is_complete": True} if call_count == 1 else [uncompleted]
                )

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post(f"/api/deadlines/{DEADLINE_ID}/uncomplete")
            assert r.status_code == 200

    def test_not_found_404(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post("/api/deadlines/nope/uncomplete")
            assert r.status_code == 404


class TestDeleteDeadline:
    def test_deletes_204(self, client):
        with patch("api.deadlines.get_service_client") as mock_db, \
             patch("api.deadlines.write_audit_log"):
            db = MagicMock()
            db.table.return_value = make_query_chain(DEADLINE_ROW)
            mock_db.return_value = db

            r = client.delete(f"/api/deadlines/{DEADLINE_ID}")
            assert r.status_code == 204

    def test_not_found_404(self, client):
        with patch("api.deadlines.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.delete("/api/deadlines/nope")
            assert r.status_code == 404
