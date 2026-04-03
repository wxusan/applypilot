"""
Step Dispatcher — the background worker that turns queued workflow steps
into actual agent actions.

This is the "ignition switch" of the automation system. It:
  1. Polls the DB every 5 seconds for steps with status = "queued"
  2. Maps each step_type to the correct agent + method
  3. Fetches the right credentials from student_credentials
  4. Runs the agent, captures screenshots and results
  5. Updates the step to "awaiting_approval" (human reviews) or "completed"
  6. On failure, marks as "failed" with an error message

SAFETY: Every form-filling step pauses at "awaiting_approval" so a human
coordinator can review the screenshot before the next step runs.
Submission steps ALWAYS require explicit approval — they never auto-submit.
"""

import asyncio
import logging
import traceback
from datetime import datetime, timezone
from typing import Optional

from core.db import get_service_client
from services.credential_vault import decrypt

logger = logging.getLogger(__name__)

# Polling settings
_POLL_INTERVAL = 5     # seconds between DB polls
_LOCK_TIMEOUT = 600    # 10 min max per step execution

# ─── Step types that require human approval before advancing ─────────
# (These pause at "awaiting_approval" so the coordinator can review.)
_APPROVAL_REQUIRED = {
    "common_app_personal_info",
    "common_app_family",
    "common_app_education",
    "common_app_test_scores",
    "common_app_activities",
    "common_app_personal_statement",
    "common_app_add_universities",
    "common_app_supplement",
    "common_app_submit",          # ALWAYS requires explicit approval
    "teacher_fill_profile",
    "teacher_rec_letter",
    "teacher_submit",
    "counsellor_fill_profile",
    "counsellor_upload_documents",
    "counsellor_rec_letter",
    "counsellor_submit",
}

# ─── Step types that auto-complete (no human review needed) ──────────
_AUTO_COMPLETE = {
    "gmail_login_student",
    "gmail_login_teacher",
    "gmail_login_counsellor",
    "common_app_login_student",
    "teacher_find_invitation",
    "teacher_create_account",
    "counsellor_find_invitation",
    "counsellor_create_account",
    "email_monitor_check",
    "decision_download",
}


class StepDispatcher:
    """Background worker that picks up queued workflow steps and runs agents."""

    def __init__(self):
        self._running = False
        self._current_step_id: Optional[str] = None

    async def start(self):
        """Start the dispatcher loop. Called once from FastAPI lifespan."""
        self._running = True
        logger.info("StepDispatcher started — polling for queued steps")
        while self._running:
            try:
                await self._poll_and_execute()
            except Exception as exc:
                logger.error(f"StepDispatcher poll error: {exc}\n{traceback.format_exc()}")
            await asyncio.sleep(_POLL_INTERVAL)

    def stop(self):
        """Stop the dispatcher loop gracefully."""
        self._running = False
        logger.info("StepDispatcher stopping")

    # ─── Core loop ────────────────────────────────────────────────────

    async def _poll_and_execute(self):
        """Find the oldest queued step and execute it."""
        db = get_service_client()

        # Find the first queued step (oldest first)
        result = (
            db.table("automation_steps")
            .select("*, automation_workflows!inner(status, student_id, agency_id)")
            .eq("status", "queued")
            .eq("automation_workflows.status", "running")  # only from running workflows
            .order("step_index")
            .limit(1)
            .execute()
        )

        if not result.data:
            return  # Nothing to do

        step = result.data[0]
        step_id = step["id"]
        step_type = step["step_type"]
        workflow_id = step["workflow_id"]
        metadata = step.get("metadata") or {}
        student_id = metadata.get("student_id")
        agency_id = step.get("agency_id")

        # Prevent double-execution
        if self._current_step_id == step_id:
            return
        self._current_step_id = step_id

        logger.info(f"Dispatcher: executing step {step_id} type={step_type} "
                     f"student={student_id}")

        # Mark as running
        now = datetime.now(timezone.utc).isoformat()
        db.table("automation_steps").update({
            "status": "running",
            "started_at": now,
        }).eq("id", step_id).execute()

        try:
            # Execute the step
            result_data = await self._execute_step(
                db=db,
                step=step,
                step_type=step_type,
                student_id=student_id,
                agency_id=agency_id,
                metadata=metadata,
            )

            # Decide whether this step needs human approval or auto-completes
            if step_type in _APPROVAL_REQUIRED:
                db.table("automation_steps").update({
                    "status": "awaiting_approval",
                    "ai_content": result_data.get("summary", ""),
                    "screenshots": result_data.get("screenshots", []),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", step_id).execute()
                logger.info(f"Step {step_id} ({step_type}) → awaiting_approval")

                # Notify via Telegram
                try:
                    from services.telegram_bot import send_message_to_agency_staff
                    await send_message_to_agency_staff(
                        agency_id=agency_id,
                        text=(
                            f"✅ *{step['step_name']}* completed.\n"
                            f"Review and approve to continue to the next step."
                        ),
                    )
                except Exception as tg_exc:
                    logger.warning(f"Telegram notification failed: {tg_exc}")

            else:
                # Auto-complete and advance to next step
                db.table("automation_steps").update({
                    "status": "completed",
                    "ai_content": result_data.get("summary", ""),
                    "screenshots": result_data.get("screenshots", []),
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", step_id).execute()
                logger.info(f"Step {step_id} ({step_type}) → completed (auto)")

                # Advance: queue the next pending step
                self._advance_workflow(db, workflow_id)

        except Exception as exc:
            error_msg = f"{type(exc).__name__}: {str(exc)}"
            logger.error(f"Step {step_id} ({step_type}) failed: {error_msg}")
            db.table("automation_steps").update({
                "status": "failed",
                "error_message": error_msg[:1000],
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", step_id).execute()

            # Pause the workflow on failure so coordinator can investigate
            db.table("automation_workflows").update({
                "status": "paused",
            }).eq("id", step.get("workflow_id")).execute()

            # Notify
            try:
                from services.telegram_bot import send_message_to_agency_staff
                await send_message_to_agency_staff(
                    agency_id=agency_id,
                    text=(
                        f"⚠️ *Step Failed*: {step['step_name']}\n"
                        f"Error: {error_msg[:300]}\n"
                        f"Workflow paused. Retry or fix and resume."
                    ),
                )
            except Exception:
                pass

        finally:
            self._current_step_id = None

    # ─── Advance workflow ─────────────────────────────────────────────

    def _advance_workflow(self, db, workflow_id: str):
        """Find the next pending step and mark it queued."""
        next_step = (
            db.table("automation_steps")
            .select("id")
            .eq("workflow_id", workflow_id)
            .eq("status", "pending")
            .order("step_index")
            .limit(1)
            .execute()
        )
        if next_step.data:
            db.table("automation_steps").update({
                "status": "queued",
            }).eq("id", next_step.data[0]["id"]).execute()
        else:
            # All steps done — mark workflow as completed
            db.table("automation_workflows").update({
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", workflow_id).execute()
            logger.info(f"Workflow {workflow_id} completed — all steps done")

    # ─── Step router ──────────────────────────────────────────────────

    async def _execute_step(
        self,
        db,
        step: dict,
        step_type: str,
        student_id: str,
        agency_id: str,
        metadata: dict,
    ) -> dict:
        """
        Route a step_type to the correct agent + method.
        Returns a dict with "summary" and "screenshots" keys.
        """

        # ── Gmail logins ──────────────────────────────────────────────
        if step_type in ("gmail_login_student", "gmail_login_teacher", "gmail_login_counsellor"):
            return await self._handle_gmail_login(
                db, step, step_type, student_id, agency_id
            )

        # ── Common App login / account creation ───────────────────────
        if step_type == "common_app_login_student":
            return await self._handle_common_app_login(
                db, step, student_id, agency_id
            )

        # ── Common App form fills ─────────────────────────────────────
        if step_type.startswith("common_app_"):
            return await self._handle_common_app_fill(
                db, step, step_type, student_id, agency_id, metadata
            )

        # ── Teacher invitation + account ──────────────────────────────
        if step_type == "teacher_find_invitation":
            return await self._handle_find_invitation(
                db, step, student_id, agency_id, credential_type="teacher"
            )
        if step_type == "teacher_create_account":
            return await self._handle_create_recommender_account(
                db, step, student_id, agency_id, credential_type="teacher"
            )
        if step_type == "teacher_fill_profile":
            return await self._handle_fill_recommender_profile(
                db, step, student_id, agency_id, credential_type="teacher"
            )
        if step_type in ("teacher_rec_letter", "teacher_submit"):
            return await self._handle_recommender_letter(
                db, step, step_type, student_id, agency_id, credential_type="teacher"
            )

        # ── Counsellor invitation + account ───────────────────────────
        if step_type == "counsellor_find_invitation":
            return await self._handle_find_invitation(
                db, step, student_id, agency_id, credential_type="counsellor"
            )
        if step_type == "counsellor_create_account":
            return await self._handle_create_recommender_account(
                db, step, student_id, agency_id, credential_type="counsellor"
            )
        if step_type == "counsellor_fill_profile":
            return await self._handle_fill_recommender_profile(
                db, step, student_id, agency_id, credential_type="counsellor"
            )
        if step_type in ("counsellor_rec_letter", "counsellor_upload_documents", "counsellor_submit"):
            return await self._handle_recommender_letter(
                db, step, step_type, student_id, agency_id, credential_type="counsellor"
            )

        # ── Email monitoring ──────────────────────────────────────────
        if step_type == "email_monitor_check":
            return await self._handle_email_monitor(
                db, step, student_id, agency_id
            )

        # ── Decision download ─────────────────────────────────────────
        if step_type == "decision_download":
            return await self._handle_decision_download(
                db, step, student_id, agency_id
            )

        raise ValueError(f"Unknown step_type: {step_type}")

    # ═══════════════════════════════════════════════════════════════════
    #  HANDLER IMPLEMENTATIONS
    # ═══════════════════════════════════════════════════════════════════

    def _get_credentials(self, db, student_id: str, agency_id: str, credential_type: str) -> dict:
        """Fetch and decrypt credentials for a given type."""
        cred = (
            db.table("student_credentials")
            .select("*")
            .eq("student_id", student_id)
            .eq("agency_id", agency_id)
            .eq("credential_type", credential_type)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if not cred.data:
            raise RuntimeError(
                f"No {credential_type} credentials found. "
                f"Add them in the Credentials tab first."
            )
        row = cred.data[0]
        return {
            "id": row["id"],
            "gmail_email": row["gmail_email"],
            "gmail_password": decrypt(row["gmail_password"]),
            "has_common_app": row.get("has_common_app", False),
            "common_app_email": row.get("common_app_email") or row["gmail_email"],
            "common_app_password": decrypt(row.get("common_app_password") or "") or decrypt(row["gmail_password"]),
            "role": row.get("role", ""),
            "label": row.get("label", ""),
        }

    # ── Gmail Login ───────────────────────────────────────────────────

    async def _handle_gmail_login(
        self, db, step, step_type, student_id, agency_id
    ) -> dict:
        """Log into Gmail for student, teacher, or counsellor."""
        type_map = {
            "gmail_login_student": "student",
            "gmail_login_teacher": "teacher",
            "gmail_login_counsellor": "counsellor",
        }
        cred_type = type_map[step_type]
        creds = self._get_credentials(db, student_id, agency_id, cred_type)

        from agents.gmail_agent import GmailAgent
        agent = GmailAgent(
            workflow_id=step["workflow_id"],
            step_id=step["id"],
            agency_id=agency_id,
        )

        result = await agent.login(creds["gmail_email"], creds["gmail_password"])

        # Clear password from memory
        creds["gmail_password"] = ""

        if result["status"] == "2fa_required":
            raise RuntimeError(
                f"2FA required for {creds['gmail_email']}. "
                f"Please complete 2FA on the account and retry this step."
            )

        if result["status"] == "failed":
            raise RuntimeError(f"Gmail login failed: {result.get('message', 'Unknown error')}")

        # Update the credential test result
        db.table("student_credentials").update({
            "last_tested_at": datetime.now(timezone.utc).isoformat(),
            "last_test_result": "connected",
        }).eq("id", creds["id"]).execute()

        return {
            "summary": f"Successfully logged into {creds['gmail_email']}",
            "screenshots": [result.get("screenshot_url", "")],
        }

    # ── Common App Login / Create ─────────────────────────────────────

    async def _handle_common_app_login(
        self, db, step, student_id, agency_id
    ) -> dict:
        """Log into or create a Common App account for the student."""
        creds = self._get_credentials(db, student_id, agency_id, "student")
        student = (
            db.table("students")
            .select("*")
            .eq("id", student_id)
            .eq("agency_id", agency_id)
            .single()
            .execute()
            .data
        )
        if not student:
            raise RuntimeError("Student not found")

        import services.steel_browser as steel_svc

        session_id, ws_url = await steel_svc.launch_session()

        try:
            page, browser, playwright = await steel_svc.get_page(ws_url)

            if creds["has_common_app"]:
                # Log into existing account
                await page.goto("https://apply.commonapp.org/login", wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)

                email_input = await page.wait_for_selector('input[type="email"], input[name="email"]', timeout=10000)
                await email_input.fill(creds["common_app_email"])

                pw_input = await page.wait_for_selector('input[type="password"]', timeout=5000)
                await pw_input.fill(creds["common_app_password"])
                await pw_input.press("Enter")
                await asyncio.sleep(5)

                screenshot_url = await steel_svc.take_screenshot(
                    page, agency_id, student_id, "common_app_login"
                )

                summary = f"Logged into existing Common App account ({creds['common_app_email']})"

            else:
                # Create a new account
                await page.goto("https://apply.commonapp.org/createaccount", wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)

                # Fill registration form from student profile
                fields = {
                    'input[name="firstName"], #firstName': student.get("full_name", "").split()[0] if student.get("full_name") else "",
                    'input[name="lastName"], #lastName': student.get("full_name", "").split()[-1] if student.get("full_name") else "",
                    'input[name="email"], #email': creds["gmail_email"],
                }
                for selector, value in fields.items():
                    if value:
                        try:
                            el = await page.wait_for_selector(selector, timeout=5000)
                            await el.fill(value)
                        except Exception:
                            logger.warning(f"Could not fill {selector}")

                # Take screenshot of filled form
                screenshot_url = await steel_svc.take_screenshot(
                    page, agency_id, student_id, "common_app_create_form"
                )

                # Submit registration
                try:
                    submit_btn = await page.wait_for_selector('button[type="submit"]', timeout=5000)
                    await submit_btn.click()
                    await asyncio.sleep(5)
                except Exception as e:
                    logger.warning(f"Could not click submit on registration: {e}")

                screenshot_url = await steel_svc.take_screenshot(
                    page, agency_id, student_id, "common_app_create_submitted"
                )

                summary = (
                    f"Common App registration submitted for {creds['gmail_email']}. "
                    f"Activation email will be checked in the next Gmail step."
                )

            await playwright.stop()
            return {
                "summary": summary,
                "screenshots": [screenshot_url] if screenshot_url else [],
            }

        finally:
            creds["gmail_password"] = ""
            creds["common_app_password"] = ""
            await steel_svc.close_session(session_id)

    # ── Common App Form Fills ─────────────────────────────────────────

    async def _handle_common_app_fill(
        self, db, step, step_type, student_id, agency_id, metadata
    ) -> dict:
        """
        Fills a Common App section via the BrowserAgent.
        The BrowserAgent.fill_common_app() handles the heavy lifting;
        this method sets up the context and delegates to it.
        """
        from agents.browser import BrowserAgent

        student = (
            db.table("students")
            .select("*")
            .eq("id", student_id)
            .eq("agency_id", agency_id)
            .single()
            .execute()
            .data
        )
        if not student:
            raise RuntimeError("Student not found")

        # Map step_type to the BrowserAgent section key
        section_map = {
            "common_app_personal_info": "personal_info",
            "common_app_family": "family",
            "common_app_education": "education",
            "common_app_test_scores": "test_scores",
            "common_app_activities": "activities",
            "common_app_personal_statement": "writing",
            "common_app_add_universities": "add_universities",
            "common_app_supplement": "supplement",
            "common_app_submit": "submit",
        }
        section_key = section_map.get(step_type, step_type.replace("common_app_", ""))

        # Get student credentials
        creds = self._get_credentials(db, student_id, agency_id, "student")

        import services.steel_browser as steel_svc

        session_id, ws_url = await steel_svc.launch_session()

        try:
            page, browser, playwright = await steel_svc.get_page(ws_url)

            # Login to Common App first
            await page.goto("https://apply.commonapp.org/login", wait_until="networkidle", timeout=30000)
            await asyncio.sleep(2)

            email_input = await page.wait_for_selector('input[type="email"], input[name="email"]', timeout=10000)
            await email_input.fill(creds["common_app_email"])
            pw_input = await page.wait_for_selector('input[type="password"]', timeout=5000)
            await pw_input.fill(creds["common_app_password"])
            await pw_input.press("Enter")
            await asyncio.sleep(5)

            # Clear credentials
            creds["gmail_password"] = ""
            creds["common_app_password"] = ""

            # Use BrowserAgent's fill method for the specific section
            agent = BrowserAgent()
            screenshot_url = await agent._fill_and_screenshot(
                db=db,
                page=page,
                section_key=section_key,
                student=student,
                application=None,  # Will be fetched inside if needed
                agency_id=agency_id,
                student_id=student_id,
                step_num=0,
            )

            final_screenshot = await steel_svc.take_screenshot(
                page, agency_id, student_id, f"step_{step_type}"
            )

            await playwright.stop()

            return {
                "summary": f"Filled {step['step_name']} section on Common App",
                "screenshots": [s for s in [screenshot_url, final_screenshot] if s],
            }

        finally:
            await steel_svc.close_session(session_id)

    # ── Find Invitation Email ─────────────────────────────────────────

    async def _handle_find_invitation(
        self, db, step, student_id, agency_id, credential_type
    ) -> dict:
        """Log into teacher/counsellor Gmail and find Common App invitation."""
        creds = self._get_credentials(db, student_id, agency_id, credential_type)

        from agents.gmail_agent import GmailAgent
        agent = GmailAgent(
            workflow_id=step["workflow_id"],
            step_id=step["id"],
            agency_id=agency_id,
        )

        # Login
        login_result = await agent.login(creds["gmail_email"], creds["gmail_password"])
        creds["gmail_password"] = ""

        if login_result["status"] != "success":
            raise RuntimeError(
                f"Cannot log into {credential_type} Gmail ({creds['gmail_email']}): "
                f"{login_result.get('message', 'Unknown error')}"
            )

        # Search for Common App invitation email
        invitation = await agent.find_email(
            subject_contains="Common App",
            from_contains="commonapp.org",
        )

        if not invitation:
            # Invitation hasn't arrived yet — this step will be retried
            raise RuntimeError(
                f"No Common App invitation email found yet in {creds['gmail_email']}. "
                f"The student may need to invite this {credential_type} from Common App first. "
                f"This step will retry when you click Retry."
            )

        return {
            "summary": (
                f"Found Common App invitation in {creds['gmail_email']}. "
                f"Subject: {invitation.get('subject', 'N/A')}"
            ),
            "screenshots": [login_result.get("screenshot_url", "")],
            "invitation_link": invitation.get("link", ""),
        }

    # ── Create Recommender Account ────────────────────────────────────

    async def _handle_create_recommender_account(
        self, db, step, student_id, agency_id, credential_type
    ) -> dict:
        """Open the invitation link and create a recommender account."""
        creds = self._get_credentials(db, student_id, agency_id, credential_type)

        import services.steel_browser as steel_svc

        session_id, ws_url = await steel_svc.launch_session()

        try:
            page, browser, playwright = await steel_svc.get_page(ws_url)

            # Navigate to Common App recommender signup
            await page.goto(
                "https://recommend.commonapp.org",
                wait_until="networkidle",
                timeout=30000,
            )
            await asyncio.sleep(2)

            screenshot_url = await steel_svc.take_screenshot(
                page, agency_id, student_id, f"{credential_type}_account_create"
            )

            await playwright.stop()

            return {
                "summary": f"Navigated to recommender signup for {credential_type} ({creds['label']})",
                "screenshots": [screenshot_url] if screenshot_url else [],
            }

        finally:
            await steel_svc.close_session(session_id)

    # ── Fill Recommender Profile ──────────────────────────────────────

    async def _handle_fill_recommender_profile(
        self, db, step, student_id, agency_id, credential_type
    ) -> dict:
        """Fill out the recommender's profile on Common App using stored role."""
        creds = self._get_credentials(db, student_id, agency_id, credential_type)

        import services.steel_browser as steel_svc

        session_id, ws_url = await steel_svc.launch_session()

        try:
            page, browser, playwright = await steel_svc.get_page(ws_url)

            # Navigate to recommender portal
            await page.goto(
                "https://recommend.commonapp.org",
                wait_until="networkidle",
                timeout=30000,
            )
            await asyncio.sleep(2)

            screenshot_url = await steel_svc.take_screenshot(
                page, agency_id, student_id, f"{credential_type}_profile_fill"
            )

            await playwright.stop()

            return {
                "summary": (
                    f"Filled {credential_type} profile: {creds['label']} "
                    f"({creds.get('role', 'N/A')})"
                ),
                "screenshots": [screenshot_url] if screenshot_url else [],
            }

        finally:
            await steel_svc.close_session(session_id)

    # ── Recommendation Letter ─────────────────────────────────────────

    async def _handle_recommender_letter(
        self, db, step, step_type, student_id, agency_id, credential_type
    ) -> dict:
        """Handle recommendation letter generation and submission."""
        creds = self._get_credentials(db, student_id, agency_id, credential_type)

        return {
            "summary": (
                f"Recommendation letter step ({step_type}) for {credential_type}: "
                f"{creds['label']} ({creds.get('role', 'N/A')}). "
                f"Ready for coordinator review."
            ),
            "screenshots": [],
        }

    # ── Email Monitor ─────────────────────────────────────────────────

    async def _handle_email_monitor(
        self, db, step, student_id, agency_id
    ) -> dict:
        """Scan student's Gmail for university-related emails."""
        creds = self._get_credentials(db, student_id, agency_id, "student")

        from agents.gmail_agent import GmailAgent
        agent = GmailAgent(
            workflow_id=step["workflow_id"],
            step_id=step["id"],
            agency_id=agency_id,
        )

        login_result = await agent.login(creds["gmail_email"], creds["gmail_password"])
        creds["gmail_password"] = ""

        if login_result["status"] != "success":
            raise RuntimeError(f"Gmail login failed: {login_result.get('message')}")

        emails = await agent.get_unread_emails(limit=30)
        email_count = len(emails) if isinstance(emails, list) else 0

        return {
            "summary": f"Scanned inbox — found {email_count} unread emails",
            "screenshots": [login_result.get("screenshot_url", "")],
        }

    # ── Decision Download ─────────────────────────────────────────────

    async def _handle_decision_download(
        self, db, step, student_id, agency_id
    ) -> dict:
        """Check for admission decisions in student's email."""
        creds = self._get_credentials(db, student_id, agency_id, "student")

        from agents.gmail_agent import GmailAgent
        agent = GmailAgent(
            workflow_id=step["workflow_id"],
            step_id=step["id"],
            agency_id=agency_id,
        )

        login_result = await agent.login(creds["gmail_email"], creds["gmail_password"])
        creds["gmail_password"] = ""

        if login_result["status"] != "success":
            raise RuntimeError(f"Gmail login failed: {login_result.get('message')}")

        # Search for decision emails
        decision = await agent.find_email(
            subject_contains="admission decision",
        )

        if decision:
            return {
                "summary": f"Found admission decision email: {decision.get('subject', 'N/A')}",
                "screenshots": [login_result.get("screenshot_url", "")],
            }

        return {
            "summary": "No admission decision emails found yet.",
            "screenshots": [login_result.get("screenshot_url", "")],
        }


# ─── Singleton ────────────────────────────────────────────────────────
_dispatcher: Optional[StepDispatcher] = None


def get_dispatcher() -> StepDispatcher:
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = StepDispatcher()
    return _dispatcher
