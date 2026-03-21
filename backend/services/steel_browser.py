"""
Steel.dev browser service — managed cloud browser sessions for Common App automation.
Each session gets a Playwright-compatible CDP endpoint.
Credentials are never passed through this module.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Tuple

from core.config import settings
from services.storage import upload_bytes_to_r2

logger = logging.getLogger(__name__)


async def launch_session() -> Tuple[str, str]:
    """
    Create a new Steel.dev browser session.
    Returns (session_id, websocket_url).
    Raises RuntimeError if Steel is not configured or the API call fails.
    """
    if not settings.STEEL_API_KEY:
        raise RuntimeError("STEEL_API_KEY is not configured")

    try:
        from steel import Steel

        client = Steel(steel_api_key=settings.STEEL_API_KEY)
        session = client.sessions.create(
            use_proxy=False,
            solve_captcha=True,  # Let Steel handle any login CAPTCHAs
        )
        logger.info(f"Steel session created: {session.id}")
        return session.id, session.websocket_url

    except Exception as exc:
        raise RuntimeError(f"Failed to create Steel session: {exc}") from exc


async def get_session_url(session_id: str) -> Optional[str]:
    """
    Retrieve the websocket URL for an existing session.
    Returns None if the session has expired or cannot be found.
    """
    if not settings.STEEL_API_KEY or not session_id:
        return None

    try:
        from steel import Steel

        client = Steel(steel_api_key=settings.STEEL_API_KEY)
        session = client.sessions.retrieve(session_id)
        return session.websocket_url

    except Exception as exc:
        logger.warning(f"Could not retrieve Steel session {session_id}: {exc}")
        return None


async def get_page(websocket_url: str):
    """
    Connect to a Steel session via Playwright CDP.
    Returns (page, browser, playwright) — callers must close all three when done.
    """
    from playwright.async_api import async_playwright

    playwright = await async_playwright().start()
    browser = await playwright.chromium.connect_over_cdp(websocket_url)

    # Reuse the first existing context, or create a fresh one
    if browser.contexts:
        context = browser.contexts[0]
    else:
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
        )

    # Reuse the first existing page, or open a new one
    if context.pages:
        page = context.pages[0]
    else:
        page = await context.new_page()

    return page, browser, playwright


async def take_screenshot(
    page,
    agency_id: str,
    student_id: str,
    label: str,
) -> str:
    """
    Capture a full-page PNG screenshot, upload it to R2, and return the URL.
    Returns empty string on failure — non-fatal.
    """
    try:
        screenshot_bytes = await page.screenshot(full_page=True, type="png")
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        path = f"{agency_id}/{student_id}/screenshots/{label}_{ts}.png"
        url = await upload_bytes_to_r2(path, screenshot_bytes, "image/png")
        logger.info(f"Screenshot saved to R2: {path}")
        return url

    except Exception as exc:
        logger.error(f"Screenshot capture failed (label={label}): {exc}")
        return ""


async def close_session(session_id: str) -> None:
    """
    Release a Steel.dev session and free cloud browser resources.
    Non-fatal: logs a warning if the cleanup call fails.
    """
    if not settings.STEEL_API_KEY or not session_id:
        return

    try:
        from steel import Steel

        client = Steel(steel_api_key=settings.STEEL_API_KEY)
        client.sessions.release(session_id)
        logger.info(f"Steel session released: {session_id}")

    except Exception as exc:
        logger.warning(f"Failed to release Steel session {session_id}: {exc}")
