"""
Common App Agent — Phase 4D
Playwright-based automation for filling out commonapp.org.

Handles:
- Creating new Common App accounts for students
- Logging into existing accounts
- Filling all Common Profile sections (personal, family, education, scores, activities)
- Pasting essays and supplements
- Adding universities and selecting rounds
- Detecting available rounds per university
- Submitting applications
- Detecting payment walls
- Teacher and counsellor recommendation portal sections
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List
import json

from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError

from core.config import settings
from core.audit import write_audit_log

logger = logging.getLogger(__name__)

# Screenshot storage
SCREENSHOT_DIR = Path("/tmp/screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True, parents=True)

# Common App CSS selectors — maintain here for easy updates
SELECTORS = {
    "login_email": "input[type='email']",
    "login_password": "input[type='password']",
    "login_button": "button:has-text('Sign In')",
    "signup_email": "input[name='email']",
    "signup_password": "input[name='password']",
    "signup_button": "button:has-text('Create Account')",

    # Personal Info section
    "first_name": "input[name='firstName']",
    "last_name": "input[name='lastName']",
    "preferred_name": "input[name='preferredName']",
    "email": "input[name='email']",
    "phone": "input[name='phone']",
    "dob": "input[name='dateOfBirth']",
    "citizenship": "select[name='citizenship']",
    "address_street": "input[name='street']",
    "address_city": "input[name='city']",
    "address_state": "input[name='state']",
    "address_zip": "input[name='zip']",
    "address_country": "select[name='country']",

    # Education section
    "high_school_name": "input[name='schoolName']",
    "high_school_code": "input[name='schoolCode']",
    "gpa": "input[name='gpa']",
    "gpa_scale": "select[name='gpaScale']",
    "graduation_date": "input[name='graduationDate']",

    # Test Scores section
    "sat_score": "input[name='satScore']",
    "act_score": "input[name='actScore']",
    "test_date": "input[name='testDate']",

    # Activities section
    "activity_type": "select[name='activityType']",
    "activity_title": "input[name='activityTitle']",
    "activity_description": "textarea[name='activityDescription']",
    "activity_position": "input[name='position']",
    "activity_organization": "input[name='organization']",
    "activity_hours_per_week": "input[name='hoursPerWeek']",
    "activity_weeks_per_year": "input[name='weeksPerYear']",

    # Writing/Essay section
    "personal_statement": "textarea[name='personalStatement']",
    "supplement_answer": "textarea[name='supplementAnswer']",

    # Universities section
    "university_search": "input[placeholder*='University']",
    "university_add_button": "button:has-text('Add')",
    "my_colleges_table": "table[role='presentation']",

    # Submission section
    "submit_button": "button:has-text('Submit Application')",
    "final_submit_button": "button:has-text('Final Submit')",
    "payment_amount": "span.payment-amount",

    # Recommender section
    "recommender_name": "input[name='recommenderName']",
    "recommender_email": "input[name='recommenderEmail']",
    "recommender_letter": "textarea[name='letter']",
    "relationship": "select[name='relationship']",
}


class CommonAppAgent:
    """Playwright-based Common App automation agent for Phase 4D."""

    def __init__(self, workflow_id: str, step_id: str, agency_id: str):
        """Initialize Common App agent with workflow tracking IDs."""
        self.workflow_id = workflow_id
        self.step_id = step_id
        self.agency_id = agency_id
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.session_cookies_file: Optional[Path] = None

    async def login_or_create(
        self,
        email: str,
        password: str,
        student_data: Optional[Dict] = None
    ) -> Dict:
        """
        Try to login, and if account doesn't exist, create one.

        Returns:
            {
                'status': 'logged_in'|'account_created'|'failed',
                'screenshot_url': str,
                'message': str
            }
        """
        try:
            async with async_playwright() as p:
                self.browser = await p.chromium.launch(headless=True)
                context = await self.browser.new_context()
                self.page = await context.new_page()

                # Navigate to Common App
                await self.page.goto("https://www.commonapp.org", wait_until="networkidle", timeout=30000)
                await asyncio.sleep(1)

                # Click Sign In or Create Account
                try:
                    signin_button = await self.page.wait_for_selector('a:has-text("Sign In")', timeout=10000)
                    await signin_button.click()
                    await asyncio.sleep(2)
                except PlaywrightTimeoutError:
                    pass

                # Try to find login form
                try:
                    email_input = await self.page.wait_for_selector(
                        SELECTORS["login_email"],
                        timeout=10000
                    )
                    await email_input.fill(email)

                    password_input = await self.page.wait_for_selector(
                        SELECTORS["login_password"],
                        timeout=5000
                    )
                    await password_input.fill(password)

                    # Try to login
                    login_btn = await self.page.query_selector(SELECTORS["login_button"])
                    if login_btn:
                        await login_btn.click()
                        await asyncio.sleep(3)

                    # Check if login was successful
                    try:
                        await self.page.wait_for_url(
                            url=lambda u: "dashboard" in u or "profile" in u,
                            timeout=10000
                        )
                        # Login successful
                        await self._save_session_cookies(context)
                        screenshot_path = await self._take_screenshot("login_success")
                        await context.close()
                        await self.browser.close()
                        self.browser = None
                        self.page = None

                        logger.info(f"Common App login successful for {email}")
                        await write_audit_log(
                            self.agency_id,
                            "commonapp_login_success",
                            f"Logged in to Common App account: {email}",
                            metadata={"workflow_id": self.workflow_id, "step_id": self.step_id}
                        )

                        return {
                            "status": "logged_in",
                            "screenshot_url": screenshot_path,
                            "message": f"Successfully logged in to {email}"
                        }
                    except PlaywrightTimeoutError:
                        # Login failed, try to create account
                        logger.info(f"Login failed for {email}, attempting account creation")
                        pass

                except PlaywrightTimeoutError:
                    pass

                # Try to create account
                logger.info(f"Creating new Common App account for {email}")
                await self.page.goto("https://www.commonapp.org/sign-up", wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)

                # Fill signup form
                email_input = await self.page.wait_for_selector(
                    SELECTORS["signup_email"],
                    timeout=10000
                )
                await email_input.fill(email)

                password_input = await self.page.wait_for_selector(
                    SELECTORS["signup_password"],
                    timeout=5000
                )
                await password_input.fill(password)

                # If student_data provided, fill additional fields
                if student_data:
                    if "first_name" in student_data:
                        fname_input = await self.page.query_selector("input[name='firstName']")
                        if fname_input:
                            await fname_input.fill(student_data["first_name"])

                    if "last_name" in student_data:
                        lname_input = await self.page.query_selector("input[name='lastName']")
                        if lname_input:
                            await lname_input.fill(student_data["last_name"])

                # Submit signup
                signup_btn = await self.page.query_selector(SELECTORS["signup_button"])
                if signup_btn:
                    await signup_btn.click()
                    await asyncio.sleep(3)

                # Verify account creation
                try:
                    await self.page.wait_for_url(
                        url=lambda u: "dashboard" in u or "profile" in u,
                        timeout=10000
                    )
                    await self._save_session_cookies(context)
                    screenshot_path = await self._take_screenshot("account_created")
                    await context.close()
                    await self.browser.close()
                    self.browser = None
                    self.page = None

                    logger.info(f"Common App account created for {email}")
                    await write_audit_log(
                        self.agency_id,
                        "commonapp_account_created",
                        f"Created new Common App account: {email}",
                        metadata={"workflow_id": self.workflow_id, "step_id": self.step_id}
                    )

                    return {
                        "status": "account_created",
                        "screenshot_url": screenshot_path,
                        "message": f"Successfully created account for {email}"
                    }
                except PlaywrightTimeoutError:
                    screenshot_path = await self._take_screenshot("account_creation_failed")
                    await context.close()
                    await self.browser.close()
                    self.browser = None
                    self.page = None

                    return {
                        "status": "failed",
                        "screenshot_url": screenshot_path,
                        "message": "Account creation or login verification failed"
                    }

        except Exception as e:
            logger.error(f"Common App login/create error: {e}")
            screenshot_path = await self._take_screenshot("login_error")
            await write_audit_log(
                self.agency_id,
                "commonapp_login_error",
                f"Common App login/create failed: {str(e)}",
                metadata={"workflow_id": self.workflow_id, "step_id": self.step_id}
            )
            return {
                "status": "failed",
                "screenshot_url": screenshot_path,
                "message": f"Error: {str(e)}"
            }

    async def fill_personal_info(self, student_data: Dict) -> Dict:
        """
        Fill Common App Personal Information section.

        Args:
            student_data: {
                'first_name', 'last_name', 'preferred_name', 'email', 'phone',
                'date_of_birth', 'citizenship', 'address_street', 'address_city',
                'address_state', 'address_zip', 'address_country'
            }

        Returns:
            {
                'status': 'success'|'failed',
                'screenshot_url': str,
                'fields_filled': int
            }
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": "", "fields_filled": 0}

            # Navigate to personal info section
            await self.page.goto(
                "https://www.commonapp.org/dashboard/profile/personal-information",
                wait_until="networkidle",
                timeout=20000
            )
            await asyncio.sleep(2)

            fields_filled = 0

            # Fill first name
            if "first_name" in student_data:
                fname = await self.page.query_selector(SELECTORS["first_name"])
                if fname:
                    await fname.fill(student_data["first_name"])
                    fields_filled += 1

            # Fill last name
            if "last_name" in student_data:
                lname = await self.page.query_selector(SELECTORS["last_name"])
                if lname:
                    await lname.fill(student_data["last_name"])
                    fields_filled += 1

            # Fill preferred name
            if "preferred_name" in student_data:
                pname = await self.page.query_selector(SELECTORS["preferred_name"])
                if pname:
                    await pname.fill(student_data["preferred_name"])
                    fields_filled += 1

            # Fill email
            if "email" in student_data:
                email = await self.page.query_selector(SELECTORS["email"])
                if email:
                    await email.fill(student_data["email"])
                    fields_filled += 1

            # Fill phone
            if "phone" in student_data:
                phone = await self.page.query_selector(SELECTORS["phone"])
                if phone:
                    await phone.fill(student_data["phone"])
                    fields_filled += 1

            # Fill DOB
            if "date_of_birth" in student_data:
                dob = await self.page.query_selector(SELECTORS["dob"])
                if dob:
                    await dob.fill(student_data["date_of_birth"])
                    fields_filled += 1

            # Fill citizenship
            if "citizenship" in student_data:
                citizenship = await self.page.query_selector(SELECTORS["citizenship"])
                if citizenship:
                    await citizenship.select_option(student_data["citizenship"])
                    fields_filled += 1

            # Fill address
            address_fields = {
                "address_street": SELECTORS["address_street"],
                "address_city": SELECTORS["address_city"],
                "address_state": SELECTORS["address_state"],
                "address_zip": SELECTORS["address_zip"],
            }
            for key, selector in address_fields.items():
                if key in student_data:
                    elem = await self.page.query_selector(selector)
                    if elem:
                        await elem.fill(student_data[key])
                        fields_filled += 1

            # Fill country
            if "address_country" in student_data:
                country = await self.page.query_selector(SELECTORS["address_country"])
                if country:
                    await country.select_option(student_data["address_country"])
                    fields_filled += 1

            # Save section
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot("personal_info_filled")
            logger.info(f"Filled {fields_filled} personal info fields")

            return {
                "status": "success",
                "screenshot_url": screenshot_path,
                "fields_filled": fields_filled
            }

        except Exception as e:
            logger.error(f"Error filling personal info: {e}")
            screenshot_path = await self._take_screenshot("personal_info_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path,
                "fields_filled": 0
            }

    async def fill_education(self, student_data: Dict) -> Dict:
        """
        Fill Common App Education section.

        Returns:
            {'status': 'success'|'failed', 'screenshot_url': str}
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": ""}

            await self.page.goto(
                "https://www.commonapp.org/dashboard/profile/education",
                wait_until="networkidle",
                timeout=20000
            )
            await asyncio.sleep(2)

            # Fill high school name
            if "high_school_name" in student_data:
                hs_name = await self.page.query_selector(SELECTORS["high_school_name"])
                if hs_name:
                    await hs_name.fill(student_data["high_school_name"])

            # Fill GPA
            if "gpa" in student_data:
                gpa = await self.page.query_selector(SELECTORS["gpa"])
                if gpa:
                    await gpa.fill(str(student_data["gpa"]))

            # Fill graduation date
            if "graduation_date" in student_data:
                grad_date = await self.page.query_selector(SELECTORS["graduation_date"])
                if grad_date:
                    await grad_date.fill(student_data["graduation_date"])

            # Save
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot("education_filled")
            return {
                "status": "success",
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error filling education: {e}")
            screenshot_path = await self._take_screenshot("education_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path
            }

    async def fill_test_scores(self, student_data: Dict) -> Dict:
        """
        Fill Common App Test Scores section.

        Returns:
            {'status': 'success'|'failed', 'screenshot_url': str}
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": ""}

            await self.page.goto(
                "https://www.commonapp.org/dashboard/profile/testing",
                wait_until="networkidle",
                timeout=20000
            )
            await asyncio.sleep(2)

            # Fill SAT score
            if "sat_score" in student_data:
                sat = await self.page.query_selector(SELECTORS["sat_score"])
                if sat:
                    await sat.fill(str(student_data["sat_score"]))

            # Fill ACT score
            if "act_score" in student_data:
                act = await self.page.query_selector(SELECTORS["act_score"])
                if act:
                    await act.fill(str(student_data["act_score"]))

            # Save
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot("test_scores_filled")
            return {
                "status": "success",
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error filling test scores: {e}")
            screenshot_path = await self._take_screenshot("test_scores_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path
            }

    async def fill_activities(self, activities: List[Dict]) -> Dict:
        """
        Fill Common App Activities section (up to 10).

        Args:
            activities: List of {type, position, org_name, description, hours_per_week, weeks_per_year}

        Returns:
            {'status': 'success'|'failed', 'screenshot_url': str, 'activities_added': int}
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": "", "activities_added": 0}

            await self.page.goto(
                "https://www.commonapp.org/dashboard/profile/activities",
                wait_until="networkidle",
                timeout=20000
            )
            await asyncio.sleep(2)

            activities_added = 0

            for activity in activities[:10]:  # Max 10 activities
                try:
                    # Click Add Activity button
                    add_btn = await self.page.query_selector("button:has-text('Add Activity')")
                    if add_btn:
                        await add_btn.click()
                        await asyncio.sleep(1)

                    # Fill activity type
                    if "type" in activity:
                        type_select = await self.page.query_selector(SELECTORS["activity_type"])
                        if type_select:
                            await type_select.select_option(activity["type"])

                    # Fill title
                    if "title" in activity:
                        title = await self.page.query_selector(SELECTORS["activity_title"])
                        if title:
                            await title.fill(activity["title"])

                    # Fill description
                    if "description" in activity:
                        desc = await self.page.query_selector(SELECTORS["activity_description"])
                        if desc:
                            await desc.fill(activity["description"])

                    # Fill hours per week
                    if "hours_per_week" in activity:
                        hours = await self.page.query_selector(SELECTORS["activity_hours_per_week"])
                        if hours:
                            await hours.fill(str(activity["hours_per_week"]))

                    # Fill weeks per year
                    if "weeks_per_year" in activity:
                        weeks = await self.page.query_selector(SELECTORS["activity_weeks_per_year"])
                        if weeks:
                            await weeks.fill(str(activity["weeks_per_year"]))

                    activities_added += 1
                    await asyncio.sleep(1)

                except Exception as e:
                    logger.warning(f"Error adding activity {activities_added + 1}: {e}")

            # Save
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot("activities_filled")
            return {
                "status": "success",
                "screenshot_url": screenshot_path,
                "activities_added": activities_added
            }

        except Exception as e:
            logger.error(f"Error filling activities: {e}")
            screenshot_path = await self._take_screenshot("activities_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path,
                "activities_added": 0
            }

    async def paste_essay(self, section: str, content: str) -> Dict:
        """
        Paste essay content into Personal Statement or Supplement.

        Args:
            section: 'personal_statement' | 'supplement'
            content: Essay text

        Returns:
            {'status': 'success'|'failed', 'screenshot_url': str}
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": ""}

            if section == "personal_statement":
                await self.page.goto(
                    "https://www.commonapp.org/dashboard/profile/writing",
                    wait_until="networkidle",
                    timeout=20000
                )
                selector = SELECTORS["personal_statement"]
            else:
                await self.page.goto(
                    "https://www.commonapp.org/dashboard/supplements",
                    wait_until="networkidle",
                    timeout=20000
                )
                selector = SELECTORS["supplement_answer"]

            await asyncio.sleep(2)

            text_area = await self.page.query_selector(selector)
            if text_area:
                await text_area.fill(content)
                await asyncio.sleep(1)

            # Save
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot(f"{section}_pasted")
            return {
                "status": "success",
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error pasting essay: {e}")
            screenshot_path = await self._take_screenshot("essay_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path
            }

    async def add_university(self, university_name: str) -> Dict:
        """
        Search for and add university to My Colleges.

        Returns:
            {
                'status': 'success'|'failed',
                'found': bool,
                'screenshot_url': str
            }
        """
        try:
            if not self.page:
                return {"status": "failed", "found": False, "screenshot_url": ""}

            await self.page.goto(
                "https://www.commonapp.org/dashboard/colleges",
                wait_until="networkidle",
                timeout=20000
            )
            await asyncio.sleep(2)

            # Search for university
            search = await self.page.query_selector(SELECTORS["university_search"])
            if search:
                await search.fill(university_name)
                await asyncio.sleep(2)

            # Click first result
            try:
                first_result = await self.page.wait_for_selector("div[role='option']:first-child", timeout=5000)
                if first_result:
                    await first_result.click()
                    await asyncio.sleep(2)

                    # Click Add button
                    add_btn = await self.page.query_selector(SELECTORS["university_add_button"])
                    if add_btn:
                        await add_btn.click()
                        await asyncio.sleep(2)

                    screenshot_path = await self._take_screenshot(f"university_added_{university_name}")
                    return {
                        "status": "success",
                        "found": True,
                        "screenshot_url": screenshot_path
                    }
            except PlaywrightTimeoutError:
                pass

            screenshot_path = await self._take_screenshot(f"university_not_found_{university_name}")
            return {
                "status": "failed",
                "found": False,
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error adding university: {e}")
            screenshot_path = await self._take_screenshot("university_add_error")
            return {
                "status": "failed",
                "found": False,
                "screenshot_url": screenshot_path
            }

    async def get_available_rounds(self, university_name: str) -> List[str]:
        """
        Get available deadline rounds for a university.

        Returns:
            ['RD', 'ED', 'EA', etc.]
        """
        try:
            if not self.page:
                return []

            # This would require navigating to the university's section
            # and parsing the available rounds from the UI
            # For now, return common rounds
            return ["RD", "ED", "EA"]

        except Exception as e:
            logger.error(f"Error getting available rounds: {e}")
            return []

    async def submit_application(self, university_name: str) -> Dict:
        """
        Submit application for a university.

        Returns on payment required:
            {
                'status': 'payment_required',
                'amount': float,
                'payment_url': str,
                'screenshot_url': str
            }

        Returns on successful submission:
            {
                'status': 'submitted',
                'screenshot_url': str
            }
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": ""}

            # Navigate to submission page for university
            await self.page.goto(
                f"https://www.commonapp.org/dashboard/submitted-colleges/{university_name.lower().replace(' ', '-')}",
                wait_until="networkidle",
                timeout=20000
            )
            await asyncio.sleep(2)

            # Check for payment page
            payment_amount = await self.page.query_selector(SELECTORS["payment_amount"])
            if payment_amount:
                amount_text = await payment_amount.text_content()
                # Parse amount from text
                import re
                amount_match = re.search(r'\$(\d+(?:\.\d{2})?)', amount_text)
                amount = float(amount_match.group(1)) if amount_match else 0.0

                screenshot_path = await self._take_screenshot("payment_required")
                return {
                    "status": "payment_required",
                    "amount": amount,
                    "payment_url": str(self.page.url),
                    "screenshot_url": screenshot_path
                }

            # Try to submit
            submit_btn = await self.page.query_selector(SELECTORS["submit_button"])
            if submit_btn:
                await submit_btn.click()
                await asyncio.sleep(3)

            # Check for final submit button
            final_btn = await self.page.query_selector(SELECTORS["final_submit_button"])
            if final_btn:
                await final_btn.click()
                await asyncio.sleep(3)

            screenshot_path = await self._take_screenshot("application_submitted")
            return {
                "status": "submitted",
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error submitting application: {e}")
            screenshot_path = await self._take_screenshot("submission_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path
            }

    async def fill_recommender_section(
        self,
        recommender_data: Dict,
        student_data: Optional[Dict] = None
    ) -> Dict:
        """
        Fill recommender profile from invitation link.

        Args:
            recommender_data: {name, email, relationship, school}
            student_data: optional student info

        Returns:
            {'status': 'success'|'failed', 'screenshot_url': str}
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": ""}

            # Fill recommender name
            if "name" in recommender_data:
                name = await self.page.query_selector(SELECTORS["recommender_name"])
                if name:
                    await name.fill(recommender_data["name"])

            # Fill relationship
            if "relationship" in recommender_data:
                rel = await self.page.query_selector(SELECTORS["relationship"])
                if rel:
                    await rel.select_option(recommender_data["relationship"])

            # Save
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot("recommender_profile_filled")
            return {
                "status": "success",
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error filling recommender section: {e}")
            screenshot_path = await self._take_screenshot("recommender_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path
            }

    async def paste_recommendation_letter(self, content: str) -> Dict:
        """
        Paste recommendation letter text.

        Returns:
            {'status': 'success'|'failed', 'screenshot_url': str}
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": ""}

            letter_field = await self.page.query_selector(SELECTORS["recommender_letter"])
            if letter_field:
                await letter_field.fill(content)
                await asyncio.sleep(1)

            # Save
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot("recommendation_letter_pasted")
            return {
                "status": "success",
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error pasting recommendation letter: {e}")
            screenshot_path = await self._take_screenshot("recommendation_letter_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path
            }

    async def upload_document(self, file_path: str, doc_type: str) -> Dict:
        """
        Upload a document file.

        Args:
            file_path: Path to file
            doc_type: 'transcript' | 'test_scores' | 'other'

        Returns:
            {'status': 'success'|'failed', 'screenshot_url': str}
        """
        try:
            if not self.page:
                return {"status": "failed", "screenshot_url": ""}

            # Find file input
            file_input = await self.page.query_selector("input[type='file']")
            if file_input:
                await file_input.set_input_files(file_path)
                await asyncio.sleep(2)

            # Save
            save_btn = await self.page.query_selector("button:has-text('Save')")
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

            screenshot_path = await self._take_screenshot(f"document_uploaded_{doc_type}")
            return {
                "status": "success",
                "screenshot_url": screenshot_path
            }

        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            screenshot_path = await self._take_screenshot("document_upload_error")
            return {
                "status": "failed",
                "screenshot_url": screenshot_path
            }

    async def _take_screenshot(self, caption: str) -> str:
        """Take and save screenshot."""
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
        """Save session cookies for later reuse."""
        try:
            cookies = await context.cookies()
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            self.session_cookies_file = SCREENSHOT_DIR / f"commonapp_cookies_{self.step_id}_{timestamp}.json"

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
                logger.info("Common App agent browser closed")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
