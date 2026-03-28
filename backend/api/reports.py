"""
Reports API — list, download, and manually trigger reports.

Agency admins can:
  GET  /api/reports              — list their agency's reports
  GET  /api/reports/{id}/download — refresh presigned URL and redirect
  POST /api/reports/generate     — manually trigger a report

Super admins can also fetch platform-scope reports via /api/reports?scope=platform.
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

from core.auth import get_current_user, get_super_admin
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Reports"], prefix="/reports")


class GenerateReportRequest(BaseModel):
    report_type: str  # "weekly" | "monthly" | "yearly"
    agency_id: Optional[str] = None  # super admin only; omit for own agency


# ── Agency report endpoints ────────────────────────────────────────────────

@router.get("/")
async def list_reports(
    report_type: Optional[str] = Query(None, description="weekly | monthly | yearly"),
    limit: int = Query(20, le=100),
    user: AuthUser = Depends(get_current_user),
):
    """List reports for the current user's agency, newest first."""
    db = get_service_client()

    query = (
        db.table("reports")
        .select("id, report_type, period_label, period_start, period_end, summary_json, pdf_url, generated_at, scope")
        .eq("agency_id", user.agency_id)
        .eq("scope", "agency")
        .order("generated_at", desc=True)
        .limit(limit)
    )

    if report_type:
        query = query.eq("report_type", report_type)

    result = query.execute()
    return {"reports": result.data or []}


@router.get("/{report_id}/pdf")
async def stream_report_pdf(
    report_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Regenerate and stream the PDF directly — no R2 required."""
    db = get_service_client()

    report = (
        db.table("reports")
        .select("id, agency_id, report_type, period_label, period_start, period_end")
        .eq("id", report_id)
        .single()
        .execute()
    )
    if not report.data:
        raise HTTPException(status_code=404, detail="Report not found")

    r = report.data
    if r.get("agency_id") != user.agency_id:
        raise HTTPException(status_code=403, detail="Not authorised")

    ag = db.table("agencies").select("name").eq("id", user.agency_id).single().execute()
    agency_name = ag.data["name"] if ag.data else "Agency"

    from agents.reporter import ReporterAgent
    reporter = ReporterAgent()
    period_start = date.fromisoformat(r["period_start"])
    period_end   = date.fromisoformat(r["period_end"])
    metrics   = await reporter._fetch_agency_metrics(user.agency_id, period_start, period_end)
    pdf_bytes = reporter._build_agency_pdf(
        agency_name, r["report_type"], r["period_label"], period_start, period_end, metrics
    )

    filename = f"ApplyPilot_{r['period_label'].replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{report_id}/download")
async def get_report_download_url(
    report_id: str,
    user: AuthUser = Depends(get_current_user),
):
    """Return a fresh presigned download URL for a report PDF."""
    db = get_service_client()

    report = (
        db.table("reports")
        .select("id, agency_id, pdf_storage_path, pdf_url, period_label, report_type")
        .eq("id", report_id)
        .single()
        .execute()
    )

    if not report.data:
        raise HTTPException(status_code=404, detail="Report not found")

    r = report.data

    # Security: agency members can only access their own reports
    if r.get("agency_id") != user.agency_id:
        raise HTTPException(status_code=403, detail="Not authorised")

    # Refresh presigned URL
    if r.get("pdf_storage_path"):
        try:
            import boto3
            from core.config import settings

            s3 = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT_URL,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                region_name="auto",
            )
            fresh_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.R2_BUCKET_NAME, "Key": r["pdf_storage_path"]},
                ExpiresIn=3600,  # 1 hour
            )

            # Persist fresh URL
            db.table("reports").update({"pdf_url": fresh_url}).eq("id", report_id).execute()
        except Exception as exc:
            # Fall back to stored URL
            fresh_url = r.get("pdf_url")
    else:
        fresh_url = r.get("pdf_url")

    if not fresh_url:
        raise HTTPException(status_code=404, detail="PDF not available for this report")

    return {
        "report_id": report_id,
        "period_label": r["period_label"],
        "report_type": r["report_type"],
        "download_url": fresh_url,
        "expires_in_seconds": 3600,
    }


@router.post("/generate")
async def generate_report(
    body: GenerateReportRequest,
    user: AuthUser = Depends(get_current_user),
):
    """
    Manually trigger a report generation for the current agency.
    Runs synchronously — may take 5–15 seconds for large datasets.
    """
    if body.report_type not in ("weekly", "monthly", "yearly"):
        raise HTTPException(status_code=400, detail="report_type must be weekly, monthly, or yearly")

    from agents.reporter import ReporterAgent

    try:
        report = await ReporterAgent().generate_single_agency_report(user.agency_id, body.report_type)
        return {"message": "Report generated", "report": report}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}")


# ── Super admin report endpoints ───────────────────────────────────────────

@router.get("/platform/list")
async def list_platform_reports(
    report_type: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    user: AuthUser = Depends(get_super_admin),
):
    """Super admin: list platform-scope reports."""
    db = get_service_client()

    query = (
        db.table("reports")
        .select("id, report_type, period_label, period_start, period_end, summary_json, pdf_url, generated_at")
        .eq("scope", "platform")
        .order("generated_at", desc=True)
        .limit(limit)
    )
    if report_type:
        query = query.eq("report_type", report_type)

    result = query.execute()
    return {"reports": result.data or []}


@router.get("/platform/{report_id}/download")
async def get_platform_report_download(
    report_id: str,
    user: AuthUser = Depends(get_super_admin),
):
    """Super admin: get download URL for a platform report."""
    db = get_service_client()

    report = (
        db.table("reports")
        .select("id, scope, pdf_storage_path, pdf_url, period_label, report_type")
        .eq("id", report_id)
        .eq("scope", "platform")
        .single()
        .execute()
    )

    if not report.data:
        raise HTTPException(status_code=404, detail="Platform report not found")

    r = report.data
    fresh_url = r.get("pdf_url")

    if r.get("pdf_storage_path"):
        try:
            import boto3
            from core.config import settings

            s3 = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT_URL,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                region_name="auto",
            )
            fresh_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.R2_BUCKET_NAME, "Key": r["pdf_storage_path"]},
                ExpiresIn=3600,
            )
            db.table("reports").update({"pdf_url": fresh_url}).eq("id", report_id).execute()
        except Exception:
            pass

    if not fresh_url:
        raise HTTPException(status_code=404, detail="PDF not available")

    return {
        "report_id": report_id,
        "period_label": r["period_label"],
        "report_type": r["report_type"],
        "download_url": fresh_url,
        "expires_in_seconds": 3600,
    }


@router.post("/platform/generate")
async def generate_platform_report(
    body: GenerateReportRequest,
    user: AuthUser = Depends(get_super_admin),
):
    """Super admin: manually trigger a platform-scope report."""
    if body.report_type not in ("weekly", "monthly", "yearly"):
        raise HTTPException(status_code=400, detail="report_type must be weekly, monthly, or yearly")

    from agents.reporter import ReporterAgent

    try:
        await ReporterAgent().generate_platform_report(body.report_type)
        return {"message": f"Platform {body.report_type} report generated and sent to Telegram"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}")
