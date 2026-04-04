"""
Common App Selector Registry — Phase 4D
Versioned CSS/XPath selectors for commonapp.org automation.

WHY THIS EXISTS:
  CommonApp.org redesigns its UI periodically. When that happens, hardcoded
  selectors break silently — the agent runs but fills nothing, or crashes
  mid-way through a student's application. This registry centralises all
  selectors in one place so:
    1. Updates only require editing this file (not hunting across agents).
    2. A health-check endpoint can validate selectors against the live site
       before any student automation begins.
    3. Version numbers let us track which site version each selector set works with.

USAGE:
    from agents.selector_registry import get_selectors, SELECTORS

    # Use the current selector set directly
    sel = SELECTORS
    await page.fill(sel["login_email"], email)

    # Or get a specific version
    sel = get_selectors("2024.1")
"""

import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# ─── Selector Versions ───────────────────────────────────────────────────────
# When CommonApp updates their UI, add a new version here and update
# CURRENT_VERSION. Old versions are kept for reference/rollback.

_SELECTOR_VERSIONS: Dict[str, Dict[str, str]] = {

    # ── v2024.1 — layout as of 2024 application cycle ────────────────────────
    "2024.1": {
        # Auth
        "login_email":            "input[type='email']",
        "login_password":         "input[type='password']",
        "login_button":           "button:has-text('Sign In')",
        "signup_email":           "input[name='email']",
        "signup_password":        "input[name='password']",
        "signup_button":          "button:has-text('Create Account')",

        # Personal Information section
        "first_name":             "input[name='firstName']",
        "last_name":              "input[name='lastName']",
        "preferred_name":         "input[name='preferredName']",
        "email":                  "input[name='email']",
        "phone":                  "input[name='phone']",
        "dob":                    "input[name='dateOfBirth']",
        "citizenship":            "select[name='citizenship']",
        "address_street":         "input[name='street']",
        "address_city":           "input[name='city']",
        "address_state":          "input[name='state']",
        "address_zip":            "input[name='zip']",
        "address_country":        "select[name='country']",

        # Education section
        "high_school_name":       "input[name='schoolName']",
        "high_school_code":       "input[name='schoolCode']",
        "gpa":                    "input[name='gpa']",
        "gpa_scale":              "select[name='gpaScale']",
        "graduation_date":        "input[name='graduationDate']",

        # Test Scores section
        "sat_score":              "input[name='satScore']",
        "act_score":              "input[name='actScore']",
        "test_date":              "input[name='testDate']",

        # Activities section
        "activity_type":          "select[name='activityType']",
        "activity_title":         "input[name='activityTitle']",
        "activity_description":   "textarea[name='activityDescription']",
        "activity_position":      "input[name='position']",
        "activity_organization":  "input[name='organization']",
        "activity_hours_per_week": "input[name='hoursPerWeek']",
        "activity_weeks_per_year": "input[name='weeksPerYear']",
        "activity_add_button":    "button:has-text('Add Activity')",

        # Writing / Essay section
        "personal_statement":     "textarea[name='personalStatement']",
        "supplement_answer":      "textarea[name='supplementAnswer']",

        # Universities / My Colleges section
        "university_search":      "input[placeholder*='University']",
        "university_add_button":  "button:has-text('Add')",
        "my_colleges_table":      "table[role='presentation']",

        # Submission section
        "submit_button":          "button:has-text('Submit Application')",
        "final_submit_button":    "button:has-text('Final Submit')",
        "payment_amount":         "span.payment-amount",

        # Recommender section
        "recommender_name":       "input[name='recommenderName']",
        "recommender_email":      "input[name='recommenderEmail']",
        "recommender_letter":     "textarea[name='letter']",
        "relationship":           "select[name='relationship']",

        # General
        "save_button":            "button:has-text('Save')",
        "next_button":            "button:has-text('Next')",
        "error_message":          "[role='alert'], .error-message, .alert-danger",
        "success_message":        ".alert-success, [data-testid='success']",
    },
}

# The version currently in use. Change this when CommonApp updates their site.
CURRENT_VERSION = "2024.1"

# Convenience: the active selector set
SELECTORS: Dict[str, str] = _SELECTOR_VERSIONS[CURRENT_VERSION]


def get_selectors(version: Optional[str] = None) -> Dict[str, str]:
    """Return selector set for a given version (defaults to current)."""
    v = version or CURRENT_VERSION
    if v not in _SELECTOR_VERSIONS:
        logger.warning(f"Unknown selector version '{v}', falling back to {CURRENT_VERSION}")
        v = CURRENT_VERSION
    return _SELECTOR_VERSIONS[v]


def get_selector(key: str, version: Optional[str] = None) -> str:
    """Return a single selector by key. Raises KeyError if not found."""
    sel = get_selectors(version)
    if key not in sel:
        raise KeyError(
            f"Selector '{key}' not found in version '{version or CURRENT_VERSION}'. "
            f"Available keys: {list(sel.keys())}"
        )
    return sel[key]


async def health_check(page) -> Dict[str, object]:
    """
    Validate critical selectors against the live CommonApp site.
    Returns a dict with pass/fail counts and any broken selectors.

    Usage (in a health-check endpoint or scheduled job):
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto("https://www.commonapp.org")
            result = await health_check(page)
            await browser.close()
    """
    # Only check selectors that appear on the public login page (no auth needed)
    login_selectors = ["login_email", "login_password", "login_button"]

    passed, failed = [], []

    for key in login_selectors:
        selector = SELECTORS.get(key, "")
        if not selector:
            failed.append({"key": key, "reason": "selector not defined"})
            continue
        try:
            element = await page.query_selector(selector)
            if element:
                passed.append(key)
            else:
                failed.append({"key": key, "selector": selector, "reason": "element not found"})
        except Exception as e:
            failed.append({"key": key, "selector": selector, "reason": str(e)})

    status = "healthy" if not failed else "degraded"
    logger.info(f"Selector health check: {status} ({len(passed)} passed, {len(failed)} failed)")

    return {
        "status": status,
        "version": CURRENT_VERSION,
        "passed": len(passed),
        "failed": len(failed),
        "failed_selectors": failed,
    }
