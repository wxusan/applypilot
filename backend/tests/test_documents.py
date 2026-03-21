"""
Integration tests: /api/documents endpoints
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from io import BytesIO

from tests.conftest import (
    AGENCY_ID, USER_ID, STUDENT_ID, APP_ID, DOC_ID,
    make_query_chain,
)

DOC_ROW = {
    "id": DOC_ID,
    "agency_id": AGENCY_ID,
    "student_id": STUDENT_ID,
    "application_id": APP_ID,
    "doc_type": "transcript",
    "file_name": "transcript.pdf",
    "storage_url": "https://cdn.applypilot.co/transcript.pdf",
    "storage_path": f"{AGENCY_ID}/{STUDENT_ID}/transcript/transcript.pdf",
    "file_size_bytes": 1024,
    "mime_type": "application/pdf",
    "status": "uploaded",
    "ocr_processed": False,
    "uploaded_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
}

STUDENT_ROW = {"id": STUDENT_ID, "full_name": "Alice Smith"}


class TestListDocuments:
    def test_returns_document_list(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([DOC_ROW])
            mock_db.return_value = db

            r = client.get("/api/documents")
            assert r.status_code == 200
            body = r.json()
            assert "documents" in body
            assert len(body["documents"]) == 1

    def test_returns_empty_list(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain([])
            mock_db.return_value = db

            r = client.get("/api/documents")
            assert r.status_code == 200
            assert r.json()["documents"] == []


class TestDocumentChecklist:
    def test_returns_checklist_with_required_types(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain({"id": STUDENT_ID})
                return make_query_chain([DOC_ROW])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.get(f"/api/documents/checklist/{STUDENT_ID}")
            assert r.status_code == 200
            body = r.json()
            assert "checklist" in body
            doc_types = [item["doc_type"] for item in body["checklist"]]
            assert "transcript" in doc_types

    def test_checklist_marks_missing_as_not_uploaded(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain({"id": STUDENT_ID})
                return make_query_chain([])  # no documents

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.get(f"/api/documents/checklist/{STUDENT_ID}")
            assert r.status_code == 200
            for item in r.json()["checklist"]:
                if item["required"]:
                    assert item["uploaded"] is False

    def test_student_not_found_404(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.get("/api/documents/checklist/nonexistent")
            assert r.status_code == 404


class TestUploadDocument:
    def test_upload_pdf_succeeds(self, client):
        with patch("api.documents.get_service_client") as mock_db, \
             patch("api.documents.upload_file_to_r2", new_callable=AsyncMock,
                   return_value="https://cdn.example.com/doc.pdf") as mock_upload, \
             patch("api.documents.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain(STUDENT_ROW)
                return make_query_chain([DOC_ROW])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post(
                "/api/documents/upload",
                data={"student_id": STUDENT_ID, "doc_type": "transcript"},
                files={"file": ("transcript.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")},
            )
            assert r.status_code == 201

    def test_disallowed_mime_type_400(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(STUDENT_ROW)
            mock_db.return_value = db

            r = client.post(
                "/api/documents/upload",
                data={"student_id": STUDENT_ID, "doc_type": "transcript"},
                files={"file": ("virus.exe", BytesIO(b"MZ"), "application/octet-stream")},
            )
            assert r.status_code == 400
            assert "not allowed" in r.json()["detail"].lower()

    def test_student_not_found_404(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.post(
                "/api/documents/upload",
                data={"student_id": "nonexistent", "doc_type": "transcript"},
                files={"file": ("f.pdf", BytesIO(b"x"), "application/pdf")},
            )
            assert r.status_code == 404


class TestUpdateDocumentStatus:
    def test_approve_document(self, client):
        updated = {**DOC_ROW, "status": "approved"}
        with patch("api.documents.get_service_client") as mock_db, \
             patch("api.documents.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(DOC_ROW if call_count == 1 else [updated])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.patch(f"/api/documents/{DOC_ID}/status?status=approved")
            assert r.status_code == 200

    def test_reject_document_with_reason(self, client):
        updated = {**DOC_ROW, "status": "rejected", "rejection_reason": "Blurry"}
        with patch("api.documents.get_service_client") as mock_db, \
             patch("api.documents.write_audit_log"):
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                return make_query_chain(DOC_ROW if call_count == 1 else [updated])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.patch(
                f"/api/documents/{DOC_ID}/status?status=rejected&rejection_reason=Blurry"
            )
            assert r.status_code == 200

    def test_not_found_404(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.patch("/api/documents/nonexistent/status?status=approved")
            assert r.status_code == 404


class TestDeleteDocument:
    def test_deletes_204(self, client):
        with patch("api.documents.get_service_client") as mock_db, \
             patch("api.documents.delete_file_from_r2", new_callable=AsyncMock), \
             patch("api.documents.write_audit_log"):
            db = MagicMock()
            db.table.return_value = make_query_chain(DOC_ROW)
            mock_db.return_value = db

            r = client.delete(f"/api/documents/{DOC_ID}")
            assert r.status_code == 204

    def test_not_found_404(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            db.table.return_value = make_query_chain(None)
            mock_db.return_value = db

            r = client.delete("/api/documents/nonexistent")
            assert r.status_code == 404
