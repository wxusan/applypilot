"""
Portals API — Phase 4G (wired)
Tracks university application portal sessions.

Endpoints:
  GET  /api/portals?student_id=           — list portal sessions
  POST /api/portals                       — create portal entry (manual or from email monitor)
  PATCH /api/portals/{id}                 — update portal status
  POST /api/portals/{id}/activate         — trigger portal activation agent (now live)
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Portals"])


class PortalCreate(BaseModel):
    student_id: str
    university_name: str
    portal_url: Optional[str] = None
    portal_pin: Optional[str] = None


class PortalUpdate(BaseModel):
    activation_status: Optional[str] = None
    missing_documents: Optional[List[str]] = None
    uploaded_documents: Optional[List[str]] = None
    decision_status: Optional[str] = None
    decision_url: Optional[str] = None


@router.get("/portals")
async def list_portals(student_id: str, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    result = db.table("portal_sessions")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("agency_id", user.agency_id)\
        .order("created_at", desc=True)\
        .execute()
    return result.data or []


@router.post("/portals")
async def create_portal(body: PortalCreate, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    student = db.table("students").select("id, agency_id").eq("id", body.student_id).eq("agency_id", user.agency_id).single().execute()
    if not student.data:
        raise HTTPException(404, "Student not found")

    payload = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "agency_id": user.agency_id,
        "university_name": body.university_name,
        "portal_url": body.portal_url,
        "portal_pin": body.portal_pin,
        "activation_status": "not_started",
        "missing_documents": [],
        "uploaded_documents": [],
        "decision_status": "pending",
    }
    result = db.table("portal_sessions").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create portal")
    return result.data[0]


@router.patch("/portals/{portal_id}")
async def update_portal(portal_id: str, body: PortalUpdate, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    portal = db.table("portal_sessions").select("id, agency_id").eq("id", portal_id).eq("agency_id", user.agency_id).single().execute()
    if not portal.data:
        raise HTTPException(404, "Portal not found")
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        return portal.data
    result = db.table("portal_sessions").update(updates).eq("id", portal_id).execute()
    return result.data[0]


@router.post("/portals/{portal_id}/activate")
async def activate_portal(portal_id: str, user: AuthUser = Depends(get_current_user)):
    """
    Trigger portal activation via automation agent.
    Creates an agent_job, launches the browser task in background,
    and returns immediately with the job_id.
    """
    db = get_service_client()
    portal = db.table("portal_sessions").select("*").eq("id", portal_id).eq("agency_id", user.agency_id).single().execute()
    if not portal.data:
        raise HTTPException(404, "Portal not found")

    p = portal.data

    if not p.get("portal_url"):
        raise HTTPException(400, "Portal URL is required for activation. Edit the portal and add the URL first.")

    # Check for already-running activation job for this portal
    active = db.table("agent_jobs").select("id, status")\
        .eq("agency_id", user.agency_id)\
        .eq("agent_type", "portal_activation")\
        .eq("input_data->>portal_id", portal_id)\
        .in_("status", ["pending", "running"])\
        .execute()

    if active.data:
        existing_id = active.data[0]["id"]
        raise HTTPException(
            409,
            f"A portal activation job is already running (job_id: {existing_id}). Check back shortly."
        )

    # Create tracking agent_job
    now = datetime.now(timezone.utc).isoformat()
    job_res = db.table("agent_jobs").insert({
        "agency_id": user.agency_id,
        "student_id": p["student_id"],
        "agent_type": "portal_activation",
        "job_type": "activate_portal",
        "status": "pending",
        "requires_approval": False,
        "created_at": now,
        "input_data": {
            "portal_id": portal_id,
            "university_name": p["university_name"],
            "portal_url": p["portal_url"],
            "portal_pin": p.get("portal_pin"),
        },
    }).execute()

    if not job_res.data:
        raise HTTPException(500, "Failed to create activation job")

    job_id = job_res.data[0]["id"]

    # Mark portal as in-progress by updating last_checked_at
    db.table("portal_sessions").update({
        "last_checked_at": now,
    }).eq("id", portal_id).execute()

    # Launch background task
    asyncio.create_task(
        _run_portal_activation(
            job_id=job_id,
            portal_id=portal_id,
            agency_id=user.agency_id,
            student_id=p["student_id"],
            university_name=p["university_name"],
            portal_url=p["portal_url"],
            portal_pin=p.get("portal_pin"),
        )
    )

    return {
        "success": True,
        "job_id": job_id,
        "message": f"Portal activation started for {p['university_name']}. This may take 1-2 minutes.",
    }


# ──────────────────────────────────────────────
# Background: Portal activation via Steel browser
# ──────────────────────────────────────────────

async def _run_portal_activation(
    job_id: str,
    portal_id: str,
    agency_id: str,
    student_id: str,
    university_name: str,
    portal_url: str,
    portal_pin: Optional[str],
) -> None:
    """
    Background task:
    1. Launch a Steel.dev managed browser session
    2. Navigate to portal_url
    3. Fill in the PIN if provided
    4. Take a screenshot
    5. Update portal_sessions + agent_job with result
    """
    db = get_service_client()

    # Mark job running
    db.table("agent_jobs").update({
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).execute()

    session_id = None
    screenshot_url = None

    try:
        # Import Steel + Playwright
        import services.steel_browser as steel_svc
        from playwright.async_api import async_playwright
        from services.storage import upload_bytes_to_r2

        # Create Steel session
        session_id, websocket_url = await steel_svc.launch_session()

        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(websocket_url)
            context = browser.contexts[0]
            page = context.pages[0] if context.pages else await context.new_page()

            # Navigate to portal
            logger.info(f"Navigating to portal: {portal_url}")
            await page.goto(portal_url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(3)

            # If PIN provided, try to fill it
            if portal_pin:
                pin_selectors = [
                    'input[name*="pin" i]',
                    'input[name*="token" i]',
                    'input[name*="code" i]',
                    'input[placeholder*="pin" i]',
                    'input[placeholder*="code" i]',
                    'input[type="text"]',
                    'input[type="number"]',
                ]
                pin_filled = False
                for selector in pin_selectors:
                    try:
                        pin_input = await page.wait_for_selector(selector, timeout=3000)
                        if pin_input:
                            await pin_input.fill(portal_pin)
                            await pin_input.press("Enter")
                            await asyncio.sleep(2)
                            pin_filled = True
                            logger.info(f"PIN filled using selector: {selector}")
                            break
                    except Exception:
                        continue

                if not pin_filled:
                    logger.warning(f"Could not find PIN input on portal page for {university_name}")

            # Take screenshot
            await asyncio.sleep(2)
            screenshot_bytes = await page.screenshot(full_page=False)

            # Upload to R2
            try:
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
                filename = f"portals/{portal_id}_{timestamp}.png"
                screenshot_url = await upload_bytes_to_r2(
                    path=filename,
                    data=screenshot_bytes,
                    content_type="image/png",
                )
            except Exception as upload_err:
                logger.warning(f"Screenshot upload failed: {upload_err}")
                screenshot_url = None

            await browser.close()

        # Release the Steel session
        try:
            from steel import Steel
            steel_client = Steel(steel_api_key=steel_svc.settings.STEEL_API_KEY)
            steel_client.sessions.release(session_id)
        except Exception:
            pass

        # Mark portal as activated
        now = datetime.now(timezone.utc).isoformat()
        db.table("portal_sessions").update({
            "activation_status": "activated",
            "last_checked_at": now,
        }).eq("id", portal_id).execute()

        # Complete job
        db.table("agent_jobs").update({
            "status": "completed",
            "completed_at": now,
            "screenshot_urls": [screenshot_url] if screenshot_url else [],
            "output_data": {
                "portal_id": portal_id,
                "university_name": university_name,
                "activated_at": now,
                "screenshot_url": screenshot_url,
            },
        }).eq("id", job_id).execute()

        logger.info(f"Portal activation completed for {university_name} (portal_id: {portal_id})")

    except Exception as exc:
        logger.error(f"Portal activation failed for job {job_id}: {exc}")
        now = datetime.now(timezone.utc).isoformat()

        # Mark portal as failed
        db.table("portal_sessions").update({
            "activation_status": "failed",
            "last_checked_at": now,
        }).eq("id", portal_id).execute()

        # Fail the job
        db.table("agent_jobs").update({
            "status": "failed",
            "completed_at": now,
            "error_message": str(exc),
        }).eq("id", job_id).execute()
