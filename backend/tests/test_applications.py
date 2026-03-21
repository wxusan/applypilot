"""
Integration tests: /api/applications endpoints
"""

import pytest
from unittest.mock import patch, MagicMock

from tests.conftest import (
    AGENCY_ID, USER_ID, STUDENT_ID, APP_ID,
    make_query_chain,
)

APP_ROW = {
    "id": APP_ID,
    "agency_id": AGENCY_ID,
    "student_id": STUDENT_ID,
    "university_name": "MIT",
    "application_type": "regular",
    "status": "not_started",
    "common_app_status": {
        "personal_info": "not_started", "family": "not_started",
        "education": "not_started", "test_scores": "not_started",
        "activities": "not_started", "writing": "not_started",
        "additional_info": "not_started", "school_report": "not_started",
        "recommendations": "not_started", "payment": "not_started",
    },
    "portal_url": None,
    "portal_username": None,
    "notes": None,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
}

STUDENT_ROW = {"id": STUDENT_ID, "full_name": "Alice Smith"}


class TestListApplications:
    def test_returns_list(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([APP_ROW])
            mock_db.return_value = db

            r = client.get("/api/applications")
            assert r.status_code == 200
            assert "applications" in r.json()

    def test_returns_empty_list(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([])
            mock_db.return_value = db

            r = client.get("/api/applications")
            assert r.status_code == 200
            assert r.json()["applications"] == []


class TestCreateApplication:
    def test_creates_successfully(self, client):
        with patch("api.applications.get_service_client") as mock_db, \
             patch("api.applications.write_audit_log"), \
             patch("api.applications.encrypt", return_value="encrypted"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain(STUDENT_ROW)
                return make_query_chain([APP_ROW])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post("/api/applications", json={
                "student_id": STUDENT_ID,
                "university_name": "MIT",
            })
            assert r.status_code == 201
            assert r.json()["university_name"] == "MIT"

    def test_missing_required_field_422(self, client):
        r = client.post("/api/applications", json={"university_name": "MIT"})
        assert r.status_code == 422

    def test_student_not_found_404(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post("/api/applications", json={
                "student_id": "nonexistent",
                "university_name": "MIT",
            })
            assert r.status_code == 404


class TestGetApplication:
    def test_found(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(APP_ROW)
            mock_db.return_value = db

            r = client.get(f"/api/applications/{APP_ID}")
            assert r.status_code == 200
            assert r.json()["id"] == APP_ID

    def test_portal_password_not_exposed(self, client):
        """Encrypted password must be stripped from the response."""
        row = {**APP_ROW, "portal_password_encrypted": "super-secret-encrypted-value"}
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(row)
            mock_db.return_value = db

            r = client.get(f"/api/applications/{APP_ID}")
            assert r.status_code == 200
            assert "portal_password_encrypted" not in r.json()

    def test_not_found_404(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.get("/api/applications/nonexistent")
            assert r.status_code == 404


class TestUpdateApplication:
    def test_updates_status(self, client):
        updated = {**APP_ROW, "status": "submitted", "portal_password_encrypted": None}
        with patch("api.applications.get_service_client") as mock_db, \
             patch("api.applications.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain(APP_ROW)
                return make_query_chain([updated])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.patch(f"/api/applications/{APP_ID}", json={"status": "submitted"})
            assert r.status_code == 200

    def test_not_found_404(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.patch(f"/api/applications/nonexistent", json={"notes": "x"})
            assert r.status_code == 404

    def test_invalid_status_still_accepted(self, client):
        """Pydantic doesn't validate status values — they're free-form strings."""
        updated = {**APP_ROW, "status": "custom-state", "portal_password_encrypted": None}
        with patch("api.applications.get_service_client") as mock_db, \
             patch("api.applications.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(APP_ROW if call_count == 1 else [updated])

            db.table.side_effect = make_chain
            mock_db.return_value = db
            r = client.patch(f"/api/applications/{APP_ID}", json={"status": "custom-state"})
            assert r.status_code == 200


class TestUpdateSectionStatus:
    def test_updates_section(self, client):
        updated = {**APP_ROW, "common_app_status": {"personal_info": "in_progress"}}
        with patch("api.applications.get_service_client") as mock_db, \
             patch("api.applications.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(APP_ROW if call_count == 1 else [updated])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.patch(f"/api/applications/{APP_ID}/sections", json={
                "section": "personal_info",
                "status": "in_progress",
            })
            assert r.status_code == 200

    def test_invalid_section_400(self, client):
        r = client.patch(f"/api/applications/{APP_ID}/sections", json={
            "section": "nonexistent_section",
            "status": "in_progress",
        })
        assert r.status_code == 400

    def test_invalid_section_status_400(self, client):
        r = client.patch(f"/api/applications/{APP_ID}/sections", json={
            "section": "personal_info",
            "status": "accepted",   # valid for application but not for section
        })
        assert r.status_code == 400


class TestDeleteApplication:
    def test_deletes_successfully(self, client):
        with patch("api.applications.get_service_client") as mock_db, \
             patch("api.applications.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(APP_ROW if call_count == 1 else [])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.delete(f"/api/applications/{APP_ID}")
            assert r.status_code == 204

    def test_not_found_404(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.delete("/api/applications/nonexistent")
            assert r.status_code == 404
