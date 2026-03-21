"""
Regression tests — one test per bug that was found and fixed.
These will FAIL if any fixed bug is accidentally reintroduced.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from tests.conftest import (
    AGENCY_ID, USER_ID, STUDENT_ID, APP_ID, JOB_ID,
    ESSAY_ID, DOC_ID, DEADLINE_ID,
    make_query_chain, make_db_response,
)


# ────────────────────────────────────────────────────────────────────────────
# BUG-001  essays.py — agent.generate_essay() doesn't exist
#          Fixed: _run_writer_agent now calls WriterAgent._generate_essay()
# ────────────────────────────────────────────────────────────────────────────
class TestBug001EssayGenerateMethod:
    """
    The background task must NOT call agent.generate_essay() (non-existent).
    It should call _generate_essay / _score_content instead.
    We verify this by confirming the background task can be awaited without
    an AttributeError.
    """

    @pytest.mark.asyncio
    async def test_run_writer_agent_uses_correct_methods(self):
        from api.essays import _run_writer_agent

        student = {
            "id": STUDENT_ID,
            "full_name": "Alice Smith",
            "agency_id": AGENCY_ID,
        }

        mock_agent = MagicMock()
        mock_agent._generate_essay = AsyncMock(return_value="Draft essay text here.")
        mock_agent._score_content  = AsyncMock(return_value=87)
        mock_agent._send_full_approval = AsyncMock()

        with patch("api.essays.get_service_client") as mock_db, \
             patch("agents.writer.WriterAgent", return_value=mock_agent):
            db = MagicMock()
            chain = make_query_chain([{"id": ESSAY_ID}])
            db.table.return_value = chain
            mock_db.return_value = db

            # Should not raise AttributeError
            await _run_writer_agent(
                job_id=JOB_ID,
                student=student,
                prompt_text="Tell us about yourself.",
                prompt_type="personal_statement",
                application_id=APP_ID,
            )

        # generate_essay (the non-existent method) was never called
        assert not hasattr(mock_agent, "generate_essay") or \
               not mock_agent.generate_essay.called, \
               "generate_essay (non-existent method) must not be called"

        # The correct helpers were used
        mock_agent._generate_essay.assert_called_once()
        mock_agent._score_content.assert_called_once()


# ────────────────────────────────────────────────────────────────────────────
# BUG-002  essays.py L98 — unguarded result.data[0] on job create
#          Fixed: guarded with `if not job_result.data: raise HTTPException`
# ────────────────────────────────────────────────────────────────────────────
class TestBug002EssayJobCreateGuard:
    def test_generate_essay_500_when_job_insert_fails(self, client):
        with patch("api.essays.get_service_client") as mock_db:
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    # Student lookup succeeds
                    return make_query_chain({"id": STUDENT_ID, "full_name": "Alice"})
                # Job insert returns empty list → should raise 500 not IndexError
                return make_query_chain([])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            r = client.post("/api/essays/generate", json={
                "student_id": STUDENT_ID,
                "prompt_text": "Why us?",
                "prompt_type": "supplemental",
            })
            assert r.status_code == 500
            assert "IndexError" not in r.text


# ────────────────────────────────────────────────────────────────────────────
# BUG-003  applications.py L245-248 — dead duplicate `if not result.data` check
#          Fixed: removed the second dead-code block with wrong error message
# ────────────────────────────────────────────────────────────────────────────
class TestBug003ApplicationsDuplicateCheck:
    def test_update_application_returns_correct_error_message(self, client):
        """
        When update_application fails, the error detail must be
        'Failed to update application', NOT 'Failed to update section status'
        (which was the dead-code copy-paste error message).
        """
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    # existing lookup succeeds
                    return make_query_chain({
                        "id": APP_ID, "student_id": STUDENT_ID,
                        "agency_id": AGENCY_ID, "university_name": "MIT",
                        "common_app_status": {},
                    })
                # update returns empty → 500
                return make_query_chain([])

            db.table.side_effect = make_chain
            mock_db.return_value = db

            with patch("api.applications.write_audit_log"):
                r = client.patch(f"/api/applications/{APP_ID}", json={"notes": "updated"})

            assert r.status_code == 500
            body = r.json()
            assert body["detail"] == "Failed to update application"
            assert "section" not in body["detail"].lower()


# ────────────────────────────────────────────────────────────────────────────
# BUG-004  applications.py L361 — unguarded result.data[0] in update_section_status
#          Fixed: added guard before indexing
# ────────────────────────────────────────────────────────────────────────────
class TestBug004SectionStatusGuard:
    def test_update_section_status_500_not_index_error(self, client):
        with patch("api.applications.get_service_client") as mock_db:
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain({
                        "id": APP_ID, "student_id": STUDENT_ID,
                        "common_app_status": {"personal_info": "not_started"},
                    })
                return make_query_chain([])  # update fails

            db.table.side_effect = make_chain
            mock_db.return_value = db

            with patch("api.applications.write_audit_log"):
                r = client.patch(f"/api/applications/{APP_ID}/sections", json={
                    "section": "personal_info",
                    "status": "in_progress",
                })

            assert r.status_code == 500
            assert "IndexError" not in r.text


# ────────────────────────────────────────────────────────────────────────────
# BUG-005  documents.py L284 — unguarded result.data[0] in update_document_status
#          Fixed: guard added (previous session explicitly failed to apply this)
# ────────────────────────────────────────────────────────────────────────────
class TestBug005DocumentStatusGuard:
    def test_update_document_status_500_not_index_error(self, client):
        with patch("api.documents.get_service_client") as mock_db:
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain({
                        "id": DOC_ID, "doc_type": "transcript",
                        "file_name": "transcript.pdf", "status": "uploaded",
                        "student_id": STUDENT_ID,
                    })
                return make_query_chain([])  # update returns empty

            db.table.side_effect = make_chain
            mock_db.return_value = db

            with patch("api.documents.write_audit_log"):
                r = client.patch(f"/api/documents/{DOC_ID}/status?status=approved")

            assert r.status_code == 500
            assert "IndexError" not in r.text


# ────────────────────────────────────────────────────────────────────────────
# BUG-006  email_agent.py — None agency_id passed to DB when student missing
#          Fixed: early return with error log when agency_id is None
# ────────────────────────────────────────────────────────────────────────────
class TestBug006EmailAgentNoneAgencyId:
    @pytest.mark.asyncio
    async def test_sync_account_skips_when_no_agency_id(self):
        from agents.email_agent import EmailAgent

        account = {
            "id": "acct-001",
            "student_id": STUDENT_ID,
            "email_address": "alice@gmail.com",
            "imap_host": "imap.gmail.com",
            "imap_port": 993,
            "password_encrypted": "",
            "is_active": True,
            "student": {"id": STUDENT_ID, "full_name": "Alice", "agency_id": None},
        }

        agent = EmailAgent()
        # _sync_account must return early (no exception, no DB/IMAP calls)
        with patch("agents.email_agent.get_service_client") as mock_db, \
             patch("agents.email_agent.decrypt", return_value="password"), \
             patch("imaplib.IMAP4_SSL") as mock_imap:

            await agent._sync_account(account)

            # IMAP should NEVER have been connected when agency_id is missing
            mock_imap.assert_not_called()


# ────────────────────────────────────────────────────────────────────────────
# BUG-007  AnalyticsCharts SparkLine — areaD crashes when points is empty
#          Fixed: early return with "No data" SVG when data.length === 0
# ────────────────────────────────────────────────────────────────────────────
# NOTE: This is a frontend bug — covered by AnalyticsCharts.test.tsx


# ────────────────────────────────────────────────────────────────────────────
# BUG-008  agent_jobs.py approve_job — result.data[0] before guard
#          Fixed: guard moved before the index access
# ────────────────────────────────────────────────────────────────────────────
class TestBug008AgentJobApproveGuard:
    def test_approve_job_returns_500_on_db_failure(self, client):
        with patch("api.agent_jobs.get_service_client") as mock_db:
            db = MagicMock()
            call_count = 0

            def make_chain(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return make_query_chain({
                        "id": JOB_ID, "status": "awaiting_approval",
                        "agent_type": "writer", "job_type": "essay_generation",
                    })
                return make_query_chain([])  # update returns empty

            db.table.side_effect = make_chain
            mock_db.return_value = db

            with patch("api.agent_jobs.write_audit_log"):
                r = client.post(f"/api/agent-jobs/{JOB_ID}/approve")

            assert r.status_code == 500
            assert "IndexError" not in r.text


# ────────────────────────────────────────────────────────────────────────────
# BUG-009  accept-invite page — /auth/login link (404) vs /login (correct)
#          Fixed: href changed to /login
# ────────────────────────────────────────────────────────────────────────────
class TestBug009AcceptInviteLink:
    def test_login_link_correct_path(self):
        """Read the source file and assert the correct href is used."""
        import pathlib
        src = pathlib.Path(
            "../frontend/app/auth/accept-invite/page.tsx"
        ).read_text()
        # Must NOT contain the old wrong path
        assert 'href="/auth/login"' not in src, \
            "BUG-009 regression: /auth/login link is back — should be /login"
        # Must contain the correct path
        assert 'href="/login"' in src
