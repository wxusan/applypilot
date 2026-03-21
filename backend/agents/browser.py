"""
Browser Agent — automates Common App via Steel.dev cloud browser.
Every section requires explicit human approval before proceeding.
Final submission requires a separate "FINAL STEP" approval.
Credentials are decrypted in memory only and never logged.
All actions write to audit_logs.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from core.db import get_service_client
from core.config import settings
from core.encryption import decrypt
from core.audit import write_audit_log
from services.telegram_bot import send_approval_request, send_message_to_agency_staff
import services.steel_browser as steel_svc

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
#  Step definitions                                                    #
# ------------------------------------------------------------------ #

# (step_number, section_key, display_name)
STEPS = [
    (0,  "login",           "Login"),
    (1,  "personal_info",   "Personal Info"),
    (2,  "family",          "Family"),
    (3,  "education",       "Education"),
    (4,  "test_scores",     "Test Scores"),
    (5,  "activities",      "Activities"),
    (6,  "writing",         "Writing (Essays)"),
    (7,  "recommendations", "Recommendations"),
    (8,  "school_report",   "School Report"),
    (9,  "payment",         "Payment"),
    (10, "submit",          "Final Submission"),
]

_STEP_BY_KEY = {s[1]: s[0] for s in STEPS}
_STEP_BY_NUM = {s[0]: s for s in STEPS}

# Sections that have a common_app_status field
_TRACKED_SECTIONS = {
    "personal_info", "family", "education", "test_scores",
    "activities", "writing", "recommendations", "school_report", "payment",
}

# Approval poll settings
_POLL_INTERVAL = 10   # seconds between DB polls
_MAX_WAIT = 86400     # 24 hours max wait per approval gate


class BrowserAgent:

    # ------------------------------------------------------------------ #
    #  Public entry point                                                  #
    # ------------------------------------------------------------------ #

    async def fill_common_app(
        self,
        job_id: str,
        student_id: str,
        application_id: str,
        agency_id: str,
    ) -> None:
        """
        Primary entry point.  Runs as a background asyncio task.
        Starts from Step 0 (login) and drives through all sections,
        pausing at every step for human approval.
        """
        db = get_service_client()

        # Mark the parent job as running
        db.table("agent_jobs").update({
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "output_data": {
                "step": 0,
                "session_id": None,
                "websocket_url": None,
                "student_id": student_id,
                "application_id": application_id,
                "agency_id": agency_id,
                "completed_steps": [],
            },
        }).eq("id", job_id).execute()

        # Fetch student and application
        student = db.table("students").select("*").eq(
            "id", student_id
        ).eq("agency_id", agency_id).single().execute().data

        application = db.table("applications").select(
            "id, university_name, portal_username, portal_password_encrypted, status"
        ).eq("id", application_id).eq("agency_id", agency_id).single().execute().data

        if not student or not application:
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": "Student or application not found",
            }).eq("id", job_id).execute()
            return

        if not application.get("portal_password_encrypted"):
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": "No Common App portal credentials saved for this application",
            }).eq("id", job_id).execute()
            await send_message_to_agency_staff(
                agency_id=agency_id,
                text=(
                    f"⚠️ *Browser Agent Failed*\n"
                    f"Student: {student['full_name']}\n"
                    f"Reason: No Common App credentials found — add them in the application portal."
                ),
            )
            return

        # Decrypt credentials — cleared immediately after login
        username = application.get("portal_username", "")
        password = decrypt(application["portal_password_encrypted"])

        session_id: Optional[str] = None
        websocket_url: Optional[str] = None
        page = None
        browser = None
        playwright = None

        try:
            # ── Step 0: Login ────────────────────────────────────────
            session_id, websocket_url = await steel_svc.launch_session()
            page, browser, playwright = await steel_svc.get_page(websocket_url)

            await self._login(page, username, password)
            password = ""  # Clear from memory immediately

            screenshot_url = await steel_svc.take_screenshot(
                page, agency_id, student_id, "step0_login"
            )

            self._persist_step(
                db, job_id, step=0,
                session_id=session_id,
                websocket_url=websocket_url,
            )

            await write_audit_log(
                agency_id=agency_id,
                student_id=student_id,
                application_id=application_id,
                action="browser.login",
                entity_type="application",
                entity_id=application_id,
                new_value={"step": 0, "screenshot": screenshot_url},
            )

            await self._await_approval(
                db=db,
                job_id=job_id,
                agency_id=agency_id,
                step_num=0,
                message=(
                    f"✅ Logged in to Common App for *{student['full_name']}*.\n"
                    f"Ready to fill Personal Info section.\n"
                    f"Approve to continue."
                ),
                screenshot_urls=[screenshot_url],
            )

            # ── Steps 1–9: Section fills ──────────────────────────────
            for step_num, section_key, display_name in STEPS[1:10]:
                # Reconnect to Steel (or relogin if session expired)
                page, browser, playwright = await self._ensure_page(
                    db=db,
                    job_id=job_id,
                    page=page,
                    browser=browser,
                    playwright=playwright,
                    session_id=session_id,
                    websocket_url=websocket_url,
                    application=application,
                    student_id=student_id,
                    agency_id=agency_id,
                )

                screenshot_url = await self._fill_and_screenshot(
                    db=db,
                    page=page,
                    section_key=section_key,
                    student=student,
                    application=application,
                    agency_id=agency_id,
                    student_id=student_id,
                    step_num=step_num,
                )

                # Update Common App section status to in_progress then completed
                await self._update_section_status(
                    db, application_id, section_key, "completed"
                )

                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    application_id=application_id,
                    action=f"browser.section_filled",
                    entity_type="application",
                    entity_id=application_id,
                    new_value={"step": step_num, "section": section_key, "screenshot": screenshot_url},
                )

                self._persist_step(
                    db, job_id, step=step_num,
                    session_id=session_id,
                    websocket_url=websocket_url,
                    completed_section=section_key,
                )

                # Determine next section name for the approval message
                next_step = STEPS[step_num + 1] if step_num + 1 < len(STEPS) else None
                next_name = next_step[2] if next_step else "Final Submission"

                if step_num < 9:  # not payment yet
                    approval_msg = (
                        f"✅ *{display_name}* filled for *{student['full_name']}*.\n"
                        f"Review the screenshot and approve to continue to {next_name}."
                    )
                else:  # step 9 = payment
                    approval_msg = (
                        f"⚠️ *FINAL STEP* — Payment/fee waiver complete for "
                        f"*{student['full_name']}* → *{application['university_name']}*.\n\n"
                        f"Ready to *SUBMIT* the application. This cannot be undone.\n"
                        f"Approve to SUBMIT."
                    )

                await self._await_approval(
                    db=db,
                    job_id=job_id,
                    agency_id=agency_id,
                    step_num=step_num,
                    message=approval_msg,
                    screenshot_urls=[screenshot_url],
                )

            # ── Step 10: Submit ───────────────────────────────────────
            page, browser, playwright = await self._ensure_page(
                db=db,
                job_id=job_id,
                page=page,
                browser=browser,
                playwright=playwright,
                session_id=session_id,
                websocket_url=websocket_url,
                application=application,
                student_id=student_id,
                agency_id=agency_id,
            )

            confirmation_url = await self._submit_application(
                page=page,
                agency_id=agency_id,
                student_id=student_id,
            )

            now = datetime.now(timezone.utc).isoformat()
            db.table("applications").update({
                "status": "submitted",
                "submitted_at": now,
            }).eq("id", application_id).execute()

            db.table("agent_jobs").update({
                "status": "completed",
                "completed_at": now,
                "output_data": {
                    "step": 10,
                    "session_id": session_id,
                    "student_id": student_id,
                    "application_id": application_id,
                    "agency_id": agency_id,
                    "completed_steps": [s[1] for s in STEPS],
                    "confirmation_screenshot": confirmation_url,
                },
            }).eq("id", job_id).execute()

            await write_audit_log(
                agency_id=agency_id,
                student_id=student_id,
                application_id=application_id,
                action="application.submitted",
                entity_type="application",
                entity_id=application_id,
                new_value={
                    "submitted_at": now,
                    "confirmation_screenshot": confirmation_url,
                    "job_id": job_id,
                },
            )

            await send_message_to_agency_staff(
                agency_id=agency_id,
                text=(
                    f"🎉 *Application Submitted!*\n"
                    f"Student: {student['full_name']}\n"
                    f"University: {application['university_name']}\n"
                    f"Submitted at: {now[:16].replace('T', ' ')} UTC\n"
                    f"[View Confirmation]({confirmation_url})"
                    if confirmation_url else
                    f"🎉 *Application Submitted!*\n"
                    f"Student: {student['full_name']}\n"
                    f"University: {application['university_name']}\n"
                    f"Submitted at: {now[:16].replace('T', ' ')} UTC"
                ),
            )

        except asyncio.CancelledError:
            raise

        except Exception as exc:
            logger.error(f"BrowserAgent: fill_common_app failed for job {job_id}: {exc}")
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": str(exc),
            }).eq("id", job_id).execute()

            await send_message_to_agency_staff(
                agency_id=agency_id,
                text=(
                    f"⚠️ *Browser Agent Error*\n"
                    f"Student: {student['full_name'] if student else 'Unknown'}\n"
                    f"Step: {self._get_current_step(db, job_id)}\n"
                    f"Error: {str(exc)[:300]}"
                ),
            )
            await write_audit_log(
                agency_id=agency_id,
                student_id=student_id,
                application_id=application_id,
                action="browser.error",
                entity_type="agent_job",
                entity_id=job_id,
                new_value={"error": str(exc)},
            )

        finally:
            password = ""  # Ensure clear in all paths
            if playwright:
                try:
                    await playwright.stop()
                except Exception:
                    pass
            if session_id:
                await steel_svc.close_session(session_id)

    # ------------------------------------------------------------------ #
    #  Resume after server restart (or explicit resume call)              #
    # ------------------------------------------------------------------ #

    async def resume_after_approval(self, job_id: str) -> None:
        """
        Called by telegram_bot and agent_jobs API after approval.
        The primary polling loop inside fill_common_app handles normal
        approval flow.  This method handles the server-restart case:
        if the polling loop died, we resume from the last completed step.
        """
        db = get_service_client()

        job = db.table("agent_jobs").select(
            "id, status, output_data, student_id, application_id, agency_id"
        ).eq("id", job_id).single().execute().data

        if not job:
            logger.error(f"BrowserAgent.resume_after_approval: job {job_id} not found")
            return

        # If the job is "running", the polling loop is alive — no-op.
        if job["status"] == "running":
            return

        # If it's still "awaiting_approval" (polling loop died), resume.
        if job["status"] != "awaiting_approval":
            logger.info(
                f"BrowserAgent.resume_after_approval: job {job_id} has status "
                f"'{job['status']}' — skipping resume"
            )
            return

        output = job.get("output_data") or {}
        student_id = output.get("student_id") or job.get("student_id")
        application_id = output.get("application_id") or job.get("application_id")
        agency_id = output.get("agency_id") or job.get("agency_id")
        completed_steps: list = output.get("completed_steps") or []
        stored_session_id = output.get("session_id")
        stored_ws_url = output.get("websocket_url")

        if not all([student_id, application_id, agency_id]):
            logger.error(
                f"BrowserAgent.resume_after_approval: missing context in job {job_id}"
            )
            return

        # Determine next step
        next_step_num = len(completed_steps)  # 0-indexed by completed count
        if next_step_num >= len(STEPS):
            return

        _, next_section, next_display = STEPS[next_step_num]

        logger.info(
            f"BrowserAgent: resuming job {job_id} from step {next_step_num} ({next_section})"
        )

        # Mark job as running so the next approval poll doesn't double-fire
        db.table("agent_jobs").update({"status": "running"}).eq("id", job_id).execute()

        # Spawn new background task to continue from this step
        asyncio.create_task(
            self._resume_from_step(
                job_id=job_id,
                next_step_num=next_step_num,
                student_id=student_id,
                application_id=application_id,
                agency_id=agency_id,
                stored_session_id=stored_session_id,
                stored_ws_url=stored_ws_url,
                completed_steps=completed_steps,
            )
        )

    async def _resume_from_step(
        self,
        job_id: str,
        next_step_num: int,
        student_id: str,
        application_id: str,
        agency_id: str,
        stored_session_id: Optional[str],
        stored_ws_url: Optional[str],
        completed_steps: list,
    ) -> None:
        """
        Continues a browser job from next_step_num onward.
        Tries to reconnect the existing Steel session; falls back to re-login.
        """
        db = get_service_client()

        student = db.table("students").select("*").eq(
            "id", student_id
        ).eq("agency_id", agency_id).single().execute().data

        application = db.table("applications").select(
            "id, university_name, portal_username, portal_password_encrypted, status"
        ).eq("id", application_id).eq("agency_id", agency_id).single().execute().data

        if not student or not application:
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": "Student or application not found during resume",
            }).eq("id", job_id).execute()
            return

        page = None
        browser = None
        playwright = None
        session_id = stored_session_id

        try:
            # Try to reconnect to existing Steel session
            ws_url = None
            if stored_session_id:
                ws_url = await steel_svc.get_session_url(stored_session_id)

            if ws_url:
                try:
                    page, browser, playwright = await steel_svc.get_page(ws_url)
                    logger.info(f"Reconnected to existing Steel session {stored_session_id}")
                except Exception as exc:
                    logger.warning(f"Could not reconnect to session {stored_session_id}: {exc}")
                    ws_url = None

            # If reconnect failed, start fresh session and re-login
            if not ws_url:
                session_id, ws_url = await steel_svc.launch_session()
                page, browser, playwright = await steel_svc.get_page(ws_url)

                password = decrypt(application["portal_password_encrypted"])
                try:
                    await self._login(page, application.get("portal_username", ""), password)
                    logger.info(f"Re-logged in for resumed job {job_id}")
                finally:
                    password = ""  # Clear immediately

                self._persist_step(
                    db, job_id, step=0,
                    session_id=session_id,
                    websocket_url=ws_url,
                )

            # Execute remaining steps
            for step_num in range(next_step_num, len(STEPS)):
                _, section_key, display_name = STEPS[step_num]

                if section_key == "submit":
                    # Final submission
                    confirmation_url = await self._submit_application(
                        page=page,
                        agency_id=agency_id,
                        student_id=student_id,
                    )
                    now = datetime.now(timezone.utc).isoformat()
                    db.table("applications").update({
                        "status": "submitted",
                        "submitted_at": now,
                    }).eq("id", application_id).execute()

                    completed_steps = completed_steps + [section_key]
                    db.table("agent_jobs").update({
                        "status": "completed",
                        "completed_at": now,
                        "output_data": {
                            "step": step_num,
                            "session_id": session_id,
                            "student_id": student_id,
                            "application_id": application_id,
                            "agency_id": agency_id,
                            "completed_steps": completed_steps,
                            "confirmation_screenshot": confirmation_url,
                        },
                    }).eq("id", job_id).execute()

                    await write_audit_log(
                        agency_id=agency_id,
                        student_id=student_id,
                        application_id=application_id,
                        action="application.submitted",
                        entity_type="application",
                        entity_id=application_id,
                        new_value={"submitted_at": now, "job_id": job_id},
                    )
                    await send_message_to_agency_staff(
                        agency_id=agency_id,
                        text=(
                            f"🎉 *Application Submitted!*\n"
                            f"Student: {student['full_name']}\n"
                            f"University: {application['university_name']}"
                        ),
                    )
                    return

                # Fill section
                page, browser, playwright = await self._ensure_page(
                    db=db, job_id=job_id, page=page, browser=browser,
                    playwright=playwright, session_id=session_id,
                    websocket_url=ws_url, application=application,
                    student_id=student_id, agency_id=agency_id,
                )

                screenshot_url = await self._fill_and_screenshot(
                    db=db, page=page, section_key=section_key,
                    student=student, application=application,
                    agency_id=agency_id, student_id=student_id, step_num=step_num,
                )

                await self._update_section_status(
                    db, application_id, section_key, "completed"
                )

                completed_steps = completed_steps + [section_key]
                self._persist_step(
                    db, job_id, step=step_num,
                    session_id=session_id,
                    websocket_url=ws_url,
                    completed_steps=completed_steps,
                )

                await write_audit_log(
                    agency_id=agency_id,
                    student_id=student_id,
                    application_id=application_id,
                    action="browser.section_filled",
                    entity_type="application",
                    entity_id=application_id,
                    new_value={"step": step_num, "section": section_key},
                )

                next_step = STEPS[step_num + 1] if step_num + 1 < len(STEPS) else None
                next_name = next_step[2] if next_step else "done"

                if section_key == "payment":
                    approval_msg = (
                        f"⚠️ *FINAL STEP* — Payment complete for "
                        f"*{student['full_name']}* → *{application['university_name']}*.\n\n"
                        f"Ready to *SUBMIT*. This cannot be undone. Approve to SUBMIT."
                    )
                else:
                    approval_msg = (
                        f"✅ *{display_name}* filled for *{student['full_name']}*.\n"
                        f"Review and approve to continue to {next_name}."
                    )

                await self._await_approval(
                    db=db,
                    job_id=job_id,
                    agency_id=agency_id,
                    step_num=step_num,
                    message=approval_msg,
                    screenshot_urls=[screenshot_url],
                )

        except asyncio.CancelledError:
            raise

        except Exception as exc:
            logger.error(f"BrowserAgent resume failed for job {job_id}: {exc}")
            db.table("agent_jobs").update({
                "status": "failed",
                "error_message": str(exc),
            }).eq("id", job_id).execute()

            await send_message_to_agency_staff(
                agency_id=agency_id,
                text=(
                    f"⚠️ *Browser Agent Error (resumed)*\n"
                    f"Student: {student['full_name'] if student else 'Unknown'}\n"
                    f"Error: {str(exc)[:300]}"
                ),
            )
            await write_audit_log(
                agency_id=agency_id,
                student_id=student_id,
                application_id=application_id,
                action="browser.error",
                entity_type="agent_job",
                entity_id=job_id,
                new_value={"error": str(exc)},
            )

        finally:
            if playwright:
                try:
                    await playwright.stop()
                except Exception:
                    pass
            if session_id and session_id != stored_session_id:
                # Only close if it's a new session we opened
                await steel_svc.close_session(session_id)

    # ------------------------------------------------------------------ #
    #  Approval gate                                                       #
    # ------------------------------------------------------------------ #

    async def _await_approval(
        self,
        db,
        job_id: str,
        agency_id: str,
        step_num: int,
        message: str,
        screenshot_urls: list,
    ) -> None:
        """
        Set job to awaiting_approval, send Telegram message with inline
        keyboard, then poll every 10 s for up to 24 h.
        Raises RuntimeError if rejected.  Raises TimeoutError after 24 h.
        """
        _, section_key, display_name = STEPS[step_num]

        db.table("agent_jobs").update({
            "status": "awaiting_approval",
            "approval_message": message,
            "screenshot_urls": screenshot_urls,
        }).eq("id", job_id).execute()

        await send_approval_request(
            agency_id=agency_id,
            job_id=job_id,
            message=message,
            screenshot_urls=screenshot_urls,
        )

        elapsed = 0
        while elapsed < _MAX_WAIT:
            await asyncio.sleep(_POLL_INTERVAL)
            elapsed += _POLL_INTERVAL

            job = db.table("agent_jobs").select("status, rejected_reason").eq(
                "id", job_id
            ).single().execute().data

            if not job:
                raise RuntimeError(f"Job {job_id} disappeared from database")

            if job["status"] == "approved":
                # Reset to running so next step can proceed
                db.table("agent_jobs").update({"status": "running"}).eq(
                    "id", job_id
                ).execute()
                return

            if job["status"] == "rejected":
                reason = job.get("rejected_reason") or "No reason given"
                await write_audit_log(
                    agency_id=agency_id,
                    action="browser.step_rejected",
                    entity_type="agent_job",
                    entity_id=job_id,
                    new_value={"step": step_num, "section": section_key, "reason": reason},
                )
                raise RuntimeError(f"Step '{display_name}' rejected: {reason}")

        raise TimeoutError(
            f"Approval timeout after 24h for step {step_num} ({display_name})"
        )

    # ------------------------------------------------------------------ #
    #  Session management helper                                           #
    # ------------------------------------------------------------------ #

    async def _ensure_page(
        self, db, job_id, page, browser, playwright,
        session_id, websocket_url, application, student_id, agency_id,
    ):
        """
        Return the existing page if it's still alive; otherwise reconnect
        or re-login and return a fresh page handle.
        """
        # Quick liveness check
        try:
            if page and not page.is_closed():
                return page, browser, playwright
        except Exception:
            pass

        # Try to reconnect to stored session
        ws_url = await steel_svc.get_session_url(session_id) if session_id else None
        if ws_url:
            try:
                if playwright:
                    try:
                        await playwright.stop()
                    except Exception:
                        pass
                new_page, new_browser, new_playwright = await steel_svc.get_page(ws_url)
                return new_page, new_browser, new_playwright
            except Exception as exc:
                logger.warning(f"Reconnect to session {session_id} failed: {exc}")

        # Session expired — start a fresh one and re-login
        logger.info("Steel session expired — creating new session and re-logging in")
        new_session_id, new_ws_url = await steel_svc.launch_session()

        if playwright:
            try:
                await playwright.stop()
            except Exception:
                pass

        new_page, new_browser, new_playwright = await steel_svc.get_page(new_ws_url)

        password = decrypt(application["portal_password_encrypted"])
        try:
            await self._login(new_page, application.get("portal_username", ""), password)
        finally:
            password = ""

        self._persist_step(
            db, job_id, step=None,
            session_id=new_session_id,
            websocket_url=new_ws_url,
        )
        return new_page, new_browser, new_playwright

    # ------------------------------------------------------------------ #
    #  Common App form automation                                          #
    # ------------------------------------------------------------------ #

    async def _login(self, page, username: str, password: str) -> None:
        """Navigate to Common App and log in with the given credentials."""
        await page.goto("https://apply.commonapp.org/login", wait_until="networkidle")
        await page.wait_for_load_state("domcontentloaded")

        # Fill username — Common App uses id="username"
        await page.wait_for_selector("input#username, input[name='username'], input[placeholder*='Email']", timeout=15000)
        await page.fill("input#username, input[name='username']", username)

        # Fill password
        await page.fill("input#password, input[name='password'], input[type='password']", password)

        # Click Sign In
        await page.click("button[type='submit'], button#loginButton, input[type='submit']")
        await page.wait_for_load_state("networkidle", timeout=30000)

        # Confirm we're logged in (dashboard should load)
        try:
            await page.wait_for_selector(
                ".applicant-name, .dashboard, [data-qa='dashboard'], nav.main-nav",
                timeout=15000,
            )
        except Exception:
            logger.warning("Login confirmation selector not found — proceeding anyway")

        logger.info(f"Logged in to Common App as {username}")

    async def _fill_personal_info(self, page, student: dict) -> None:
        """Fill the Personal Information section."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/profile/personal-info",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        name_parts = (student.get("full_name") or "").split()
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[-1] if len(name_parts) > 1 else ""
        middle_name = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ""

        # Legal name fields
        for selector, value in [
            ("input[name='legalFirstName'], input[placeholder*='First']", first_name),
            ("input[name='legalLastName'], input[placeholder*='Last']", last_name),
            ("input[name='legalMiddleName'], input[placeholder*='Middle']", middle_name),
        ]:
            try:
                if await page.query_selector(selector):
                    await page.fill(selector, value)
            except Exception:
                pass

        # Date of birth
        dob = student.get("date_of_birth")
        if dob:
            dob_str = str(dob)
            for selector in ["input[name='dateOfBirth']", "input[placeholder*='birth']"]:
                try:
                    if await page.query_selector(selector):
                        await page.fill(selector, dob_str)
                        break
                except Exception:
                    pass

        # Email
        email = student.get("email")
        if email:
            try:
                email_sel = "input[name='email'], input[type='email']"
                if await page.query_selector(email_sel):
                    await page.fill(email_sel, email)
            except Exception:
                pass

        # Phone
        phone = student.get("phone")
        if phone:
            try:
                phone_sel = "input[name='phone'], input[name='mobilePhone'], input[placeholder*='phone']"
                if await page.query_selector(phone_sel):
                    await page.fill(phone_sel, phone)
            except Exception:
                pass

        # Save / Next button
        await self._click_save_or_next(page)

    async def _fill_family(self, page, student: dict) -> None:
        """Fill the Family section with parent info."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/profile/family",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        parent_name = student.get("parent_name") or ""
        parent_email = student.get("parent_email") or ""
        parent_phone = student.get("parent_phone") or ""

        if parent_name:
            name_parts = parent_name.split()
            first = name_parts[0] if name_parts else ""
            last = name_parts[-1] if len(name_parts) > 1 else ""
            for selector, value in [
                ("input[name='parent1FirstName'], input[placeholder*='Parent First']", first),
                ("input[name='parent1LastName'], input[placeholder*='Parent Last']", last),
            ]:
                try:
                    if await page.query_selector(selector):
                        await page.fill(selector, value)
                except Exception:
                    pass

        if parent_email:
            try:
                sel = "input[name='parent1Email'], input[placeholder*='Parent.*[Ee]mail']"
                if await page.query_selector(sel):
                    await page.fill(sel, parent_email)
            except Exception:
                pass

        if parent_phone:
            try:
                sel = "input[name='parent1Phone'], input[placeholder*='Parent.*[Pp]hone']"
                if await page.query_selector(sel):
                    await page.fill(sel, parent_phone)
            except Exception:
                pass

        await self._click_save_or_next(page)

    async def _fill_education(self, page, student: dict) -> None:
        """Fill the Education section."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/academics/education",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        hs_name = student.get("high_school_name") or ""
        hs_country = student.get("high_school_country") or ""
        grad_year = str(student.get("graduation_year") or "")

        if hs_name:
            try:
                sel = "input[name='schoolName'], input[placeholder*='school name']"
                if await page.query_selector(sel):
                    await page.fill(sel, hs_name)
                    # Wait for autocomplete and press Escape to keep typed value
                    await page.wait_for_timeout(500)
            except Exception:
                pass

        if hs_country:
            try:
                sel = "select[name='country'], select[id*='country']"
                if await page.query_selector(sel):
                    await page.select_option(sel, label=hs_country)
            except Exception:
                pass

        if grad_year:
            try:
                sel = "select[name='graduationYear'], input[name='graduationYear']"
                if await page.query_selector(sel):
                    el = await page.query_selector(sel)
                    tag = await el.evaluate("e => e.tagName.toLowerCase()")
                    if tag == "select":
                        await page.select_option(sel, grad_year)
                    else:
                        await page.fill(sel, grad_year)
            except Exception:
                pass

        # GPA
        gpa = student.get("gpa")
        if gpa is not None:
            try:
                sel = "input[name='gpa'], input[name='cumulativeGPA']"
                if await page.query_selector(sel):
                    await page.fill(sel, str(gpa))
            except Exception:
                pass

        await self._click_save_or_next(page)

    async def _fill_test_scores(self, page, student: dict) -> None:
        """Fill the Test Scores section (SAT / ACT / TOEFL / IELTS)."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/academics/test-scores",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        score_fields = [
            ("sat_total",    "input[name='satTotal'], input[name='satTotalScore']"),
            ("sat_math",     "input[name='satMath'], input[name='satMathScore']"),
            ("sat_reading",  "input[name='satReading'], input[name='satEBRW']"),
            ("act_score",    "input[name='actComposite'], input[name='actScore']"),
            ("toefl_score",  "input[name='toeflTotal'], input[name='toeflScore']"),
            ("ielts_score",  "input[name='ieltsTotal'], input[name='ieltsScore']"),
        ]

        for field, selector in score_fields:
            value = student.get(field)
            if value is not None:
                try:
                    if await page.query_selector(selector):
                        await page.fill(selector, str(value))
                except Exception:
                    pass

        await self._click_save_or_next(page)

    async def _fill_activities(self, page, student: dict) -> None:
        """Fill the Activities section (up to 10 activities)."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/academics/activities",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        activities = student.get("activities") or []
        for i, activity in enumerate(activities[:10]):
            if not isinstance(activity, dict):
                continue
            activity_name = str(activity.get("name", ""))
            activity_desc = str(activity.get("description", ""))
            position = str(activity.get("position", ""))

            try:
                # Each activity row has indexed field names
                name_sel = f"input[name='activity{i}Name'], input[data-index='{i}'][name*='name']"
                desc_sel = f"textarea[name='activity{i}Description'], textarea[data-index='{i}']"
                role_sel = f"input[name='activity{i}Role'], input[data-index='{i}'][name*='role']"

                if await page.query_selector(name_sel):
                    await page.fill(name_sel, activity_name[:50])

                if activity_desc and await page.query_selector(desc_sel):
                    await page.fill(desc_sel, activity_desc[:150])

                if position and await page.query_selector(role_sel):
                    await page.fill(role_sel, position[:50])

            except Exception:
                pass

        await self._click_save_or_next(page)

    async def _fill_writing(self, page, student: dict, db, application_id: str) -> None:
        """Paste the approved personal statement essay into the Writing section."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/academics/writing",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        # Fetch the most recent approved personal statement essay
        essay_res = db.table("essays").select("content").eq(
            "application_id", application_id
        ).eq("status", "approved").order("created_at", desc=True).limit(1).execute()

        essay_text = ""
        if essay_res.data:
            essay_text = essay_res.data[0].get("content") or ""

        if essay_text:
            try:
                sel = "textarea[name='essay'], textarea[id*='essay'], [contenteditable='true']"
                el = await page.query_selector(sel)
                if el:
                    tag = await el.evaluate("e => e.tagName.toLowerCase()")
                    if tag == "textarea":
                        await page.fill(sel, essay_text)
                    else:
                        # contenteditable div
                        await el.click()
                        await page.keyboard.press("Control+a")
                        await page.keyboard.type(essay_text[:650 * 7])  # rough char estimate
            except Exception as exc:
                logger.warning(f"Could not paste essay text: {exc}")
        else:
            logger.info("No approved essay found for writing section — skipping paste")

        await self._click_save_or_next(page)

    async def _fill_recommendations(self, page, student: dict, db, application_id: str) -> None:
        """Enter recommender names and emails to trigger rec letter requests."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/recommendations",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        recommenders_res = db.table("recommenders").select(
            "name, email, title, subject, relationship"
        ).eq("student_id", student["id"]).execute()

        for i, rec in enumerate(recommenders_res.data[:3] or []):
            name = str(rec.get("name") or "")
            email = str(rec.get("email") or "")
            if not name or not email:
                continue

            name_parts = name.split()
            first = name_parts[0] if name_parts else ""
            last = name_parts[-1] if len(name_parts) > 1 else ""

            try:
                # Click "Add Recommender" button
                add_btn = f"button[data-qa='add-recommender'], button:has-text('Add Recommender')"
                if await page.query_selector(add_btn):
                    await page.click(add_btn)
                    await page.wait_for_timeout(500)

                fname_sel = f"input[name='recommenderFirstName'], input[placeholder*='First Name']"
                lname_sel = f"input[name='recommenderLastName'], input[placeholder*='Last Name']"
                email_sel = f"input[name='recommenderEmail'], input[placeholder*='Email']"

                if await page.query_selector(fname_sel):
                    await page.fill(fname_sel, first)
                if await page.query_selector(lname_sel):
                    await page.fill(lname_sel, last)
                if await page.query_selector(email_sel):
                    await page.fill(email_sel, email)

                # Send request button
                send_sel = "button:has-text('Send Request'), button[data-qa='send-request']"
                if await page.query_selector(send_sel):
                    await page.click(send_sel)
                    await page.wait_for_timeout(1000)

            except Exception as exc:
                logger.warning(f"Could not add recommender {name}: {exc}")

        await self._click_save_or_next(page)

    async def _fill_school_report(self, page, student: dict) -> None:
        """Navigate to the School Report section (typically pre-filled by counselor)."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/schoolreport",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")
        # School report is mostly filled by the school — we just navigate and screenshot
        await page.wait_for_timeout(2000)
        await self._click_save_or_next(page)

    async def _fill_payment(self, page, student: dict, application: dict) -> None:
        """Handle payment or fee waiver selection."""
        await page.goto(
            "https://apply.commonapp.org/applicant-ux/#/payment",
            wait_until="networkidle",
        )
        await page.wait_for_load_state("domcontentloaded")

        # Check if fee waiver should be used
        fee_waiver = application.get("fee_waiver_used") or False

        if fee_waiver:
            try:
                waiver_sel = "input[value='feeWaiver'], label:has-text('Fee Waiver'), input[id*='waiver']"
                if await page.query_selector(waiver_sel):
                    await page.click(waiver_sel)
                    await page.wait_for_timeout(500)
            except Exception:
                pass
        else:
            # Navigate to payment form — staff will review via screenshot
            try:
                pay_sel = "button:has-text('Pay'), input[value='creditCard']"
                if await page.query_selector(pay_sel):
                    await page.click(pay_sel)
                    await page.wait_for_timeout(500)
            except Exception:
                pass

        # Do NOT click submit — just navigate and screenshot for approval
        await page.wait_for_timeout(1000)

    async def _submit_application(
        self, page, agency_id: str, student_id: str
    ) -> str:
        """Click the final submit button. Returns R2 URL of confirmation screenshot."""
        try:
            # Navigate to the submit page
            await page.goto(
                "https://apply.commonapp.org/applicant-ux/#/submit",
                wait_until="networkidle",
            )
            await page.wait_for_load_state("domcontentloaded")

            # Click final submit
            submit_sel = (
                "button[data-qa='submit-application'], "
                "button:has-text('Submit Application'), "
                "button:has-text('Submit My Application')"
            )
            await page.wait_for_selector(submit_sel, timeout=15000)
            await page.click(submit_sel)
            await page.wait_for_load_state("networkidle", timeout=30000)

            # Confirmation screenshot
            return await steel_svc.take_screenshot(
                page, agency_id, student_id, "step10_submitted"
            )

        except Exception as exc:
            logger.error(f"Submit click failed: {exc}")
            # Still take a screenshot to show current state
            return await steel_svc.take_screenshot(
                page, agency_id, student_id, "step10_submit_error"
            )

    # ------------------------------------------------------------------ #
    #  Section dispatch helper                                             #
    # ------------------------------------------------------------------ #

    async def _fill_and_screenshot(
        self, db, page, section_key: str, student: dict, application: dict,
        agency_id: str, student_id: str, step_num: int,
    ) -> str:
        """Dispatch to the correct fill function, take screenshot, return URL."""
        try:
            if section_key == "personal_info":
                await self._fill_personal_info(page, student)
            elif section_key == "family":
                await self._fill_family(page, student)
            elif section_key == "education":
                await self._fill_education(page, student)
            elif section_key == "test_scores":
                await self._fill_test_scores(page, student)
            elif section_key == "activities":
                await self._fill_activities(page, student)
            elif section_key == "writing":
                await self._fill_writing(page, student, db, application["id"])
            elif section_key == "recommendations":
                await self._fill_recommendations(page, student, db, application["id"])
            elif section_key == "school_report":
                await self._fill_school_report(page, student)
            elif section_key == "payment":
                await self._fill_payment(page, student, application)
        except Exception as exc:
            logger.error(f"Fill error for section '{section_key}': {exc}")

        return await steel_svc.take_screenshot(
            page, agency_id, student_id, f"step{step_num}_{section_key}"
        )

    # ------------------------------------------------------------------ #
    #  Utilities                                                           #
    # ------------------------------------------------------------------ #

    async def _click_save_or_next(self, page) -> None:
        """Click the Save / Next / Continue button on the current section."""
        selectors = [
            "button[type='submit']",
            "button:has-text('Save & Continue')",
            "button:has-text('Save and Continue')",
            "button:has-text('Next')",
            "button:has-text('Save')",
            "button[data-qa='save-button']",
        ]
        for sel in selectors:
            try:
                if await page.query_selector(sel):
                    await page.click(sel)
                    await page.wait_for_load_state("networkidle", timeout=10000)
                    return
            except Exception:
                continue

    async def _update_section_status(
        self, db, application_id: str, section_key: str, status: str
    ) -> None:
        """Merge section status into common_app_status JSONB on the applications row."""
        if section_key not in _TRACKED_SECTIONS:
            return
        try:
            current = db.table("applications").select("common_app_status").eq(
                "id", application_id
            ).single().execute().data
            current_status = (current.get("common_app_status") or {}) if current else {}
            updated = {**current_status, section_key: status}
            db.table("applications").update({"common_app_status": updated}).eq(
                "id", application_id
            ).execute()
        except Exception as exc:
            logger.warning(f"Could not update section status for {section_key}: {exc}")

    def _persist_step(
        self,
        db,
        job_id: str,
        step: Optional[int],
        session_id: str,
        websocket_url: str,
        completed_section: Optional[str] = None,
        completed_steps: Optional[list] = None,
    ) -> None:
        """Write current step state into agent_job.output_data."""
        try:
            current = db.table("agent_jobs").select("output_data").eq(
                "id", job_id
            ).single().execute().data
            existing = (current.get("output_data") or {}) if current else {}

            if completed_section and completed_section not in existing.get("completed_steps", []):
                existing_steps = existing.get("completed_steps") or []
                existing_steps = existing_steps + [completed_section]
            elif completed_steps is not None:
                existing_steps = completed_steps
            else:
                existing_steps = existing.get("completed_steps") or []

            update = {
                **existing,
                "session_id": session_id,
                "websocket_url": websocket_url,
                "completed_steps": existing_steps,
            }
            if step is not None:
                update["step"] = step

            db.table("agent_jobs").update({"output_data": update}).eq(
                "id", job_id
            ).execute()
        except Exception as exc:
            logger.warning(f"Could not persist step state for job {job_id}: {exc}")

    def _get_current_step(self, db, job_id: str) -> str:
        """Read current step name from job output_data for error messages."""
        try:
            job = db.table("agent_jobs").select("output_data").eq(
                "id", job_id
            ).single().execute().data
            if job:
                step_num = (job.get("output_data") or {}).get("step", 0)
                step = _STEP_BY_NUM.get(step_num)
                return step[1] if step else "unknown"
        except Exception:
            pass
        return "unknown"
