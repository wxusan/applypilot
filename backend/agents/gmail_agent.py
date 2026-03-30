"""
Gmail Agent — Phase 4C
Playwright-based automation for Gmail login and inbox monitoring.

Handles:
- Login with username/password
- 2FA detection and pause
- Finding specific emails by subject/sender
- Extracting links and PINs from emails
- Sending emails from logged-in account
- Returning unread emails list with AI classification
"""

import asyncio
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List
import base64
import os

from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError

from core.config import settings
from core.audit import write_audit_log

logger = logging.getLogger(__name__)

# Screenshot storage
SCREENSHOT_DIR = Path("/tmp/screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True, parents=True)


class GmailAgent:
    """Playwright-based Gmail automation agent for Phase 4C."""

    def __init__(self, workflow_id: str, step_id: str, agency_id: str):
        """Initialize Gmail agent with workflow tracking IDs."""
        self.workflow_id = workflow_id
        self.step_id = step_id
        self.agency_id = agency_id
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.session_cookies_file: Optional[Path] = None

    async def login(self, email: str, password: str) -> Dict:
        """
        Login to Gmail with username and password.

        Returns:
            {
                'status': 'success'|'failed'|'2fa_required',
                'screenshot_url': str (file path),
                'message': str
            }
        """
        try:
            # Launch browser
            async with async_playwright() as p:
                self.browser = await p.chromium.launch(headless=True)
                context = await self.browser.new_context()
                self.page = await context.new_page()

                # Navigate to Google Accounts
                await self.page.goto("https://accounts.google.com", wait_until="networkidle", timeout=30000)
                await asyncio.sleep(1)

                # Enter email
                try:
                    email_input = await self.page.wait_for_selector('input[type="email"]', timeout=10000)
                    await email_input.fill(email)
                    await email_input.press("Enter")
                    await asyncio.sleep(2)
                except PlaywrightTimeoutError:
                    screenshot_path = await self._take_screenshot("login_email_input_timeout")
                    return {
                        "status": "failed",
                        "screenshot_url": screenshot_path,
                        "message": "Email input field not found within timeout"
                    }

                # Check for 2FA or password screen
                try:
                    password_input = await self.page.wait_for_selector('input[type="password"]', timeout=10000)
                    await password_input.fill(password)
                    await password_input.press("Enter")
                    await asyncio.sleep(2)
                except PlaywrightTimeoutError:
                    # Might be 2FA screen
                    page_title = await self.page.title()
                    page_text = await self.page.content()

                    if "2-step" in page_text.lower() or "verify" in page_text.lower():
                        screenshot_path = await self._take_screenshot("login_2fa_required")
                        # Save cookies so far for potential recovery
                        await self._save_session_cookies(context)
                        await context.close()
                        await self.browser.close()
                        self.browser = None
                        self.page = None
                        return {
                            "status": "2fa_required",
                            "screenshot_url": screenshot_path,
                            "message": "Two-factor authentication required. Please complete 2FA and try again."
                        }
                    else:
                        screenshot_path = await self._take_screenshot("login_password_input_timeout")
                        return {
                            "status": "failed",
                            "screenshot_url": screenshot_path,
                            "message": "Password input field not found within timeout"
                        }

                # Wait for Gmail to load
                try:
                    await self.page.wait_for_url(url=lambda u: "mail.google.com" in u, timeout=15000)
                    await asyncio.sleep(2)
                except PlaywrightTimeoutError:
                    screenshot_path = await self._take_screenshot("login_gmail_redirect_timeout")
                    return {
                        "status": "failed",
                        "screenshot_url": screenshot_path,
                        "message": "Failed to redirect to Gmail after login"
                    }

                # Save session cookies
                await self._save_session_cookies(context)
                screenshot_path = await self._take_screenshot("login_success")

                await context.close()
                await self.browser.close()
                self.browser = None
                self.page = None

                logger.info(f"Gmail login successful for {email}")
                await write_audit_log(
                    self.agency_id,
                    "gmail_login_success",
                    f"Logged in to Gmail account: {email}",
                    metadata={"workflow_id": self.workflow_id, "step_id": self.step_id}
                )

                return {
                    "status": "success",
                    "screenshot_url": screenshot_path,
                    "message": f"Successfully logged in to {email}"
                }

        except Exception as e:
            logger.error(f"Gmail login error: {e}")
            screenshot_path = await self._take_screenshot("login_error")
            await write_audit_log(
                self.agency_id,
                "gmail_login_error",
                f"Gmail login failed: {str(e)}",
                metadata={"workflow_id": self.workflow_id, "step_id": self.step_id}
            )
            return {
                "status": "failed",
                "screenshot_url": screenshot_path,
                "message": f"Login error: {str(e)}"
            }

    async def get_unread_emails(self, limit: int = 20) -> List[Dict]:
        """
        Get list of unread emails from inbox.

        Returns:
            [
                {
                    'id': str,
                    'from_address': str,
                    'subject': str,
                    'received_at': str (ISO timestamp),
                    'body_preview': str
                },
                ...
            ]
        """
        try:
            if not self.browser or not self.page:
                return {"error": "Not logged in", "emails": []}

            # Navigate to Gmail inbox
            await self.page.goto("https://mail.google.com/mail/u/0/#inbox", wait_until="networkidle", timeout=20000)
            await asyncio.sleep(2)

            # Extract unread email rows (typically bold text indicates unread)
            emails = []
            email_rows = await self.page.query_selector_all('div[role="main"] tr[data-thread-id]')

            for idx, row in enumerate(email_rows[:limit]):
                try:
                    # Extract sender
                    sender_elem = await row.query_selector('span.yp')
                    from_address = await sender_elem.text_content() if sender_elem else "Unknown"

                    # Extract subject
                    subject_elem = await row.query_selector('span.bog')
                    subject = await subject_elem.text_content() if subject_elem else "(no subject)"

                    # Check if unread (bold styling)
                    is_bold = await row.evaluate("el => window.getComputedStyle(el).fontWeight > 400")

                    if is_bold:
                        # Extract body preview
                        preview_elem = await row.query_selector('div.y6')
                        body_preview = await preview_elem.text_content() if preview_elem else ""

                        # Extract thread ID
                        thread_id = await row.get_attribute("data-thread-id")

                        emails.append({
                            "id": thread_id or f"email_{idx}",
                            "from_address": from_address.strip(),
                            "subject": subject.strip(),
                            "received_at": datetime.utcnow().isoformat(),
                            "body_preview": body_preview.strip()[:200]
                        })
                except Exception as e:
                    logger.warning(f"Error extracting email row {idx}: {e}")
                    continue

            logger.info(f"Retrieved {len(emails)} unread emails")
            return emails

        except Exception as e:
            logger.error(f"Error getting unread emails: {e}")
            await write_audit_log(
                self.agency_id,
                "gmail_get_emails_error",
                f"Failed to retrieve unread emails: {str(e)}",
                metadata={"workflow_id": self.workflow_id, "step_id": self.step_id}
            )
            return []

    async def find_email(
        self,
        subject_contains: Optional[str] = None,
        from_contains: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Find an email matching subject and/or sender criteria.

        Returns:
            {
                'subject': str,
                'from_address': str,
                'body': str,
                'links': [str],
                'received_at': str (ISO timestamp)
            }
            or None if not found
        """
        try:
            if not self.browser or not self.page:
                return None

            # Navigate to Gmail
            await self.page.goto("https://mail.google.com/mail/u/0/#inbox", wait_until="networkidle", timeout=20000)
            await asyncio.sleep(2)

            # If we have search criteria, use Gmail search
            if subject_contains or from_contains:
                search_query = ""
                if subject_contains:
                    search_query += f'subject:{subject_contains} '
                if from_contains:
                    search_query += f'from:{from_contains}'

                # Click search box and enter query
                search_box = await self.page.wait_for_selector('input[placeholder*="Search"]', timeout=10000)
                await search_box.fill(search_query.strip())
                await search_box.press("Enter")
                await asyncio.sleep(3)

            # Get first email result
            email_row = await self.page.wait_for_selector('tr[data-thread-id]', timeout=10000)
            if not email_row:
                return None

            # Click to open email
            await email_row.click()
            await asyncio.sleep(2)

            # Extract full email content
            subject_elem = await self.page.query_selector('h2.hP')
            subject = await subject_elem.text_content() if subject_elem else ""

            from_elem = await self.page.query_selector('span.gD')
            from_address = await from_elem.text_content() if from_elem else ""

            body_elem = await self.page.query_selector('div.a3s.aiL')
            body = await body_elem.text_content() if body_elem else ""

            # Extract links from body
            links = []
            link_elems = await self.page.query_selector_all('div.a3s.aiL a')
            for link_elem in link_elems:
                href = await link_elem.get_attribute("href")
                if href:
                    links.append(href)

            logger.info(f"Found email: {subject[:50]}...")
            return {
                "subject": subject.strip(),
                "from_address": from_address.strip(),
                "body": body.strip(),
                "links": links,
                "received_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error finding email: {e}")
            return None

    async def extract_commonapp_invitation(self, credential_type: str) -> Optional[Dict]:
        """
        Search for and extract CommonApp invitation email.

        Args:
            credential_type: 'student' | 'recommender' | 'counselor'

        Returns:
            {
                'invitation_link': str,
                'student_name': str
            }
            or None if not found
        """
        try:
            search_terms = {
                "student": "Common Application invitation",
                "recommender": "recommendation portal",
                "counselor": "school counselor"
            }

            subject_search = search_terms.get(credential_type, "Common Application")

            email_data = await self.find_email(subject_contains=subject_search)

            if not email_data:
                logger.warning(f"No CommonApp {credential_type} invitation found")
                return None

            # Extract invitation link from body
            invitation_link = None
            if "commonapp.org" in email_data["body"].lower():
                # Try to find the link
                for link in email_data["links"]:
                    if "commonapp.org" in link and "invitation" in link.lower():
                        invitation_link = link
                        break
                # Fallback: use first commonapp link
                if not invitation_link:
                    for link in email_data["links"]:
                        if "commonapp.org" in link:
                            invitation_link = link
                            break

            # Extract student name from email (heuristic)
            student_name = "Student"
            body_lower = email_data["body"].lower()
            name_match = re.search(r'dear\s+([a-z\s]+)[,!.?]', body_lower)
            if name_match:
                student_name = name_match.group(1).title().strip()

            if not invitation_link:
                logger.warning(f"No invitation link found in CommonApp email")
                return None

            logger.info(f"Extracted CommonApp invitation for {student_name}")
            return {
                "invitation_link": invitation_link,
                "student_name": student_name
            }

        except Exception as e:
            logger.error(f"Error extracting CommonApp invitation: {e}")
            return None

    async def _take_screenshot(self, caption: str) -> str:
        """
        Take screenshot of current page and save to disk.

        Returns:
            File path of saved screenshot (or base64 if saving fails)
        """
        try:
            if not self.page:
                return ""

            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{self.step_id}_{caption}_{timestamp}.png"
            filepath = SCREENSHOT_DIR / filename

            await self.page.screenshot(path=str(filepath))
            logger.info(f"Screenshot saved: {filepath}")
            return str(filepath)

        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return ""

    async def _save_session_cookies(self, context) -> None:
        """Save session cookies to temporary file for later reuse."""
        try:
            cookies = await context.cookies()
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            self.session_cookies_file = SCREENSHOT_DIR / f"gmail_cookies_{self.step_id}_{timestamp}.json"

            import json
            with open(self.session_cookies_file, "w") as f:
                json.dump(cookies, f)

            logger.info(f"Session cookies saved: {self.session_cookies_file}")
        except Exception as e:
            logger.error(f"Error saving cookies: {e}")

    async def close(self) -> None:
        """Close browser and cleanup."""
        try:
            if self.browser:
                await self.browser.close()
                self.browser = None
                self.page = None
                logger.info("Gmail agent browser closed")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
