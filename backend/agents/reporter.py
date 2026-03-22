"""
Reporter Agent — generates weekly / monthly / yearly PDF reports.

For each agency:
  - Pulls metrics from Supabase (students, applications, deadlines, emails, AI usage)
  - Renders matplotlib charts to PNG in memory
  - Assembles a professional PDF with reportlab
  - Uploads to Cloudflare R2, stores path + presigned URL in the reports table
  - Sends a Telegram notification to the agency's staff
  - Also generates platform-wide reports for the super admin (Xusan)

Called by APScheduler via services/scheduler.py.
"""

import io
import logging
import uuid
from datetime import datetime, timezone, date, timedelta
from typing import Optional

import boto3
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from core.db import get_service_client
from core.config import settings
from core.audit import write_audit_log

logger = logging.getLogger(__name__)

# ── Colour palette ────────────────────────────────────────────────────────────
BRAND_BLUE   = colors.HexColor("#3B82F6")
BRAND_DARK   = colors.HexColor("#1E293B")
BRAND_LIGHT  = colors.HexColor("#F1F5F9")
ACCENT_GREEN = colors.HexColor("#22C55E")
ACCENT_RED   = colors.HexColor("#EF4444")
ACCENT_AMBER = colors.HexColor("#F59E0B")
GREY         = colors.HexColor("#64748B")
WHITE        = colors.white

# Matplotlib hex equivalents
MPL_BLUE  = "#3B82F6"
MPL_GREEN = "#22C55E"
MPL_AMBER = "#F59E0B"
MPL_RED   = "#EF4444"
MPL_GREY  = "#94A3B8"

PAGE_W, PAGE_H = A4


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _period_bounds(report_type: str) -> tuple[date, date, str]:
    """Return (period_start, period_end, period_label) for the just-completed period."""
    today = date.today()

    if report_type == "weekly":
        # Previous full Mon–Sun week
        end   = today - timedelta(days=today.weekday() + 1)  # last Sunday
        start = end - timedelta(days=6)
        week_num = start.isocalendar()[1]
        label = f"Week {week_num}, {start.year}"
        return start, end, label

    elif report_type == "monthly":
        # Previous calendar month
        first_of_this = today.replace(day=1)
        end   = first_of_this - timedelta(days=1)
        start = end.replace(day=1)
        label = start.strftime("%B %Y")
        return start, end, label

    else:  # yearly
        year  = today.year - 1
        start = date(year, 1, 1)
        end   = date(year, 12, 31)
        label = str(year)
        return start, end, label


def _fig_to_bytes(fig: plt.Figure) -> bytes:
    """Render matplotlib figure to PNG bytes."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return buf.read()


def _chart_image(png_bytes: bytes, width_cm: float = 16, height_cm: float = 7) -> RLImage:
    """Wrap PNG bytes as a reportlab Image."""
    buf = io.BytesIO(png_bytes)
    return RLImage(buf, width=width_cm * cm, height=height_cm * cm)


def _bar_chart(
    labels: list[str],
    values: list[float],
    title: str,
    ylabel: str,
    color: str = MPL_BLUE,
) -> bytes:
    fig, ax = plt.subplots(figsize=(10, 4))
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    x = range(len(labels))
    bars = ax.bar(x, values, color=color, alpha=0.85, width=0.55, zorder=3)
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, fontsize=8)
    ax.set_ylabel(ylabel, fontsize=9, color="#64748B")
    ax.set_title(title, fontsize=11, fontweight="bold", color="#1E293B", pad=10)
    ax.tick_params(colors="#94A3B8")
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.yaxis.set_tick_params(length=0)
    ax.grid(axis="y", color="#E2E8F0", zorder=0)

    # Value labels on bars
    for bar, val in zip(bars, values):
        if val > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + max(values) * 0.01,
                f"{val:,.0f}" if val >= 10 else f"{val:.1f}",
                ha="center", va="bottom", fontsize=7, color="#475569",
            )

    fig.tight_layout()
    return _fig_to_bytes(fig)


def _donut_chart(values: list[float], labels: list[str], title: str) -> bytes:
    fig, ax = plt.subplots(figsize=(5, 4))
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    palette = [MPL_BLUE, MPL_GREEN, MPL_AMBER, MPL_RED, MPL_GREY, "#A78BFA", "#F472B6"]
    colors_list = palette[:len(values)]

    wedges, texts, autotexts = ax.pie(
        values,
        labels=labels,
        colors=colors_list,
        autopct="%1.0f%%",
        startangle=90,
        wedgeprops=dict(width=0.55, edgecolor="white"),
        textprops={"fontsize": 8},
    )
    for at in autotexts:
        at.set_fontsize(7)
        at.set_color("white")

    ax.set_title(title, fontsize=11, fontweight="bold", color="#1E293B", pad=10)
    fig.tight_layout()
    return _fig_to_bytes(fig)


def _line_chart(
    dates: list[str],
    series: dict[str, list[float]],
    title: str,
    ylabel: str,
) -> bytes:
    fig, ax = plt.subplots(figsize=(10, 4))
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    palette = [MPL_BLUE, MPL_GREEN, MPL_AMBER, MPL_RED]
    for i, (name, vals) in enumerate(series.items()):
        ax.plot(dates, vals, marker="o", markersize=4, linewidth=2,
                label=name, color=palette[i % len(palette)])

    ax.set_ylabel(ylabel, fontsize=9, color="#64748B")
    ax.set_title(title, fontsize=11, fontweight="bold", color="#1E293B", pad=10)
    ax.tick_params(colors="#94A3B8", labelsize=7)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(color="#E2E8F0", zorder=0)
    if len(series) > 1:
        ax.legend(fontsize=8, framealpha=0.5)

    # Rotate x-labels
    plt.xticks(rotation=30, ha="right")
    fig.tight_layout()
    return _fig_to_bytes(fig)


def _upload_pdf_to_r2(pdf_bytes: bytes, path: str) -> str:
    """Upload PDF to Cloudflare R2. Returns presigned URL (1 week expiry)."""
    s3 = boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )
    s3.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=path,
        Body=pdf_bytes,
        ContentType="application/pdf",
    )
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": path},
        ExpiresIn=7 * 24 * 3600,  # 1 week
    )
    return url


# ══════════════════════════════════════════════════════════════════════════════
#  PDF styles
# ══════════════════════════════════════════════════════════════════════════════

def _get_styles():
    styles = getSampleStyleSheet()
    custom = {
        "h1": ParagraphStyle("h1", parent=styles["Normal"],
                             fontSize=22, fontName="Helvetica-Bold",
                             textColor=BRAND_DARK, spaceAfter=4),
        "h2": ParagraphStyle("h2", parent=styles["Normal"],
                             fontSize=14, fontName="Helvetica-Bold",
                             textColor=BRAND_DARK, spaceBefore=14, spaceAfter=4),
        "h3": ParagraphStyle("h3", parent=styles["Normal"],
                             fontSize=11, fontName="Helvetica-Bold",
                             textColor=GREY, spaceBefore=8, spaceAfter=2),
        "body": ParagraphStyle("body", parent=styles["Normal"],
                               fontSize=9, textColor=colors.HexColor("#334155"),
                               spaceAfter=4, leading=14),
        "caption": ParagraphStyle("caption", parent=styles["Normal"],
                                  fontSize=8, textColor=GREY,
                                  alignment=TA_CENTER, spaceAfter=6),
        "metric_value": ParagraphStyle("metric_value", parent=styles["Normal"],
                                       fontSize=28, fontName="Helvetica-Bold",
                                       textColor=BRAND_BLUE, alignment=TA_CENTER),
        "metric_label": ParagraphStyle("metric_label", parent=styles["Normal"],
                                       fontSize=8, textColor=GREY,
                                       alignment=TA_CENTER),
        "right": ParagraphStyle("right", parent=styles["Normal"],
                                fontSize=9, alignment=TA_RIGHT, textColor=GREY),
    }
    return custom


# ══════════════════════════════════════════════════════════════════════════════
#  Agency Report Builder
# ══════════════════════════════════════════════════════════════════════════════

class ReporterAgent:

    # ── Public entry points ─────────────────────────────────────────────────

    async def generate_all_agency_reports(self, report_type: str) -> None:
        """Generate reports for every agency. Called by scheduler."""
        db = get_service_client()
        agencies = db.table("agencies").select("id, name, slug").execute()

        for ag in agencies.data or []:
            try:
                await self._generate_agency_report(ag["id"], ag["name"], report_type)
                logger.info(f"Reporter: {report_type} report done for {ag['name']}")
            except Exception as exc:
                logger.error(f"Reporter: failed agency report for {ag['id']}: {exc}")

    async def generate_platform_report(self, report_type: str) -> None:
        """Generate platform-wide report for the super admin."""
        try:
            await self._generate_platform_report(report_type)
            logger.info(f"Reporter: platform {report_type} report done")
        except Exception as exc:
            logger.error(f"Reporter: platform report failed: {exc}")

    async def generate_single_agency_report(self, agency_id: str, report_type: str) -> dict:
        """Manual trigger from API. Returns the saved report row."""
        db = get_service_client()
        ag = db.table("agencies").select("id, name, slug").eq("id", agency_id).single().execute()
        if not ag.data:
            raise ValueError(f"Agency {agency_id} not found")
        return await self._generate_agency_report(ag.data["id"], ag.data["name"], report_type)

    # ── Agency report internals ─────────────────────────────────────────────

    async def _generate_agency_report(
        self, agency_id: str, agency_name: str, report_type: str
    ) -> dict:
        db = get_service_client()
        period_start, period_end, period_label = _period_bounds(report_type)

        # ── Fetch metrics ────────────────────────────────────────────────────
        metrics = await self._fetch_agency_metrics(agency_id, period_start, period_end)

        # ── Build PDF ────────────────────────────────────────────────────────
        pdf_bytes = self._build_agency_pdf(
            agency_name, report_type, period_label, period_start, period_end, metrics
        )

        # ── Upload to R2 ─────────────────────────────────────────────────────
        r2_path = f"reports/{agency_id}/{report_type}/{period_label.replace(' ', '_')}.pdf"
        try:
            pdf_url = _upload_pdf_to_r2(pdf_bytes, r2_path)
        except Exception as exc:
            logger.error(f"Reporter: R2 upload failed: {exc}")
            pdf_url = None

        # ── Save to DB ───────────────────────────────────────────────────────
        report_res = db.table("reports").insert({
            "agency_id": agency_id,
            "scope": "agency",
            "report_type": report_type,
            "period_label": period_label,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "summary_json": {
                "total_students": metrics["total_students"],
                "active_students": metrics["active_students"],
                "applications_submitted": metrics["applications_submitted"],
                "acceptance_rate_pct": metrics["acceptance_rate_pct"],
                "emails_received": metrics["emails_received"],
                "deadlines_completed": metrics["deadlines_completed"],
                "ai_tokens_used": metrics["ai_tokens_used"],
                "ai_cost_usd": metrics["ai_cost_usd"],
            },
            "pdf_storage_path": r2_path,
            "pdf_url": pdf_url,
            "telegram_sent": False,
        }).execute()

        report = report_res.data[0] if report_res.data else {}
        report_id = report.get("id", "")

        # ── Send Telegram ─────────────────────────────────────────────────────
        await self._send_agency_telegram(agency_id, agency_name, report_type, period_label, metrics, pdf_url)

        if report_id:
            db.table("reports").update({"telegram_sent": True}).eq("id", report_id).execute()

        return report

    async def _fetch_agency_metrics(
        self, agency_id: str, period_start: date, period_end: date
    ) -> dict:
        db = get_service_client()
        start_iso = period_start.isoformat()
        end_iso   = (period_end + timedelta(days=1)).isoformat()  # exclusive upper bound

        # Students
        students = db.table("students").select("id, status, created_at").eq("agency_id", agency_id).execute()
        all_students = students.data or []
        total_students = len(all_students)
        active_students = sum(1 for s in all_students if s.get("status") == "active")
        new_students = sum(
            1 for s in all_students
            if s.get("created_at", "") >= start_iso and s.get("created_at", "") < end_iso
        )

        # Applications
        apps = db.table("applications").select(
            "id, status, created_at"
        ).eq("agency_id", agency_id).gte("created_at", start_iso).lt("created_at", end_iso).execute()
        all_apps = apps.data or []
        apps_submitted   = len(all_apps)
        apps_accepted    = sum(1 for a in all_apps if a.get("status") == "accepted")
        apps_rejected    = sum(1 for a in all_apps if a.get("status") == "rejected")
        apps_in_progress = sum(1 for a in all_apps if a.get("status") == "in_progress")

        acceptance_rate = round(apps_accepted / max(apps_submitted, 1) * 100, 1)

        # Deadlines
        deadlines = db.table("deadlines").select(
            "id, is_complete, due_date"
        ).eq("agency_id", agency_id).gte("due_date", start_iso).lt("due_date", end_iso).execute()
        all_deadlines = deadlines.data or []
        deadlines_total     = len(all_deadlines)
        deadlines_completed = sum(1 for d in all_deadlines if d.get("is_complete"))
        deadlines_missed    = deadlines_total - deadlines_completed

        # Emails
        emails = db.table("emails").select(
            "id, direction, category"
        ).eq("agency_id", agency_id).gte("received_at", start_iso).lt("received_at", end_iso).execute()
        all_emails = emails.data or []
        emails_received   = sum(1 for e in all_emails if e.get("direction") == "inbound")
        emails_urgent     = sum(1 for e in all_emails if e.get("category") in {"acceptance", "rejection", "waitlist", "interview_invite"})

        # Category breakdown
        category_counts: dict = {}
        for e in all_emails:
            cat = e.get("category", "general")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        # AI usage
        ai_logs = db.table("ai_usage_logs").select(
            "agent_type, tokens_spent, cost_usd, timestamp"
        ).eq("agency_id", agency_id).gte("timestamp", start_iso).lt("timestamp", end_iso).execute()
        ai_data = ai_logs.data or []
        ai_tokens_used = sum(r.get("tokens_spent", 0) for r in ai_data)
        ai_cost_usd    = round(sum(float(r.get("cost_usd", 0)) for r in ai_data), 4)

        # AI by agent type
        ai_by_agent: dict = {}
        for r in ai_data:
            at = r.get("agent_type", "unknown")
            ai_by_agent[at] = ai_by_agent.get(at, 0) + r.get("tokens_spent", 0)

        # Daily AI token burn (for chart)
        days = (period_end - period_start).days + 1
        daily_labels = [(period_start + timedelta(days=i)).strftime("%m/%d") for i in range(min(days, 31))]
        daily_tokens = [0] * len(daily_labels)

        for r in ai_data:
            ts = r.get("timestamp", "")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
                    idx = (dt - period_start).days
                    if 0 <= idx < len(daily_tokens):
                        daily_tokens[idx] += r.get("tokens_spent", 0)
                except Exception:
                    pass

        return {
            "total_students": total_students,
            "active_students": active_students,
            "new_students": new_students,
            "applications_submitted": apps_submitted,
            "applications_accepted": apps_accepted,
            "applications_rejected": apps_rejected,
            "applications_in_progress": apps_in_progress,
            "acceptance_rate_pct": acceptance_rate,
            "deadlines_total": deadlines_total,
            "deadlines_completed": deadlines_completed,
            "deadlines_missed": deadlines_missed,
            "emails_received": emails_received,
            "emails_urgent": emails_urgent,
            "email_categories": category_counts,
            "ai_tokens_used": ai_tokens_used,
            "ai_cost_usd": ai_cost_usd,
            "ai_by_agent": ai_by_agent,
            "daily_labels": daily_labels,
            "daily_tokens": daily_tokens,
        }

    def _build_agency_pdf(
        self,
        agency_name: str,
        report_type: str,
        period_label: str,
        period_start: date,
        period_end: date,
        m: dict,
    ) -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            leftMargin=2 * cm, rightMargin=2 * cm,
            topMargin=2 * cm, bottomMargin=2 * cm,
        )
        S = _get_styles()
        story = []

        # ── Header ───────────────────────────────────────────────────────────
        story.append(Paragraph("ApplyPilot", S["h1"]))
        story.append(Paragraph(
            f"{report_type.capitalize()} Report — {agency_name}",
            ParagraphStyle("sub", fontSize=13, textColor=GREY, fontName="Helvetica"),
        ))
        story.append(Paragraph(
            f"{period_label}  ·  {period_start.strftime('%d %b %Y')} – {period_end.strftime('%d %b %Y')}",
            ParagraphStyle("dates", fontSize=9, textColor=GREY),
        ))
        story.append(Spacer(1, 0.3 * cm))
        story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE))
        story.append(Spacer(1, 0.4 * cm))

        # ── Key Metrics summary table ─────────────────────────────────────────
        story.append(Paragraph("Key Metrics", S["h2"]))

        kpi_data = [
            [
                Paragraph(f"{m['total_students']}", S["metric_value"]),
                Paragraph(f"{m['active_students']}", S["metric_value"]),
                Paragraph(f"{m['new_students']}", S["metric_value"]),
                Paragraph(f"{m['applications_submitted']}", S["metric_value"]),
            ],
            [
                Paragraph("Total Students", S["metric_label"]),
                Paragraph("Active", S["metric_label"]),
                Paragraph("New This Period", S["metric_label"]),
                Paragraph("Applications", S["metric_label"]),
            ],
            [
                Paragraph(f"{m['acceptance_rate_pct']}%", S["metric_value"]),
                Paragraph(f"{m['deadlines_completed']}", S["metric_value"]),
                Paragraph(f"{m['emails_received']}", S["metric_value"]),
                Paragraph(f"${m['ai_cost_usd']:.4f}", S["metric_value"]),
            ],
            [
                Paragraph("Acceptance Rate", S["metric_label"]),
                Paragraph("Deadlines Done", S["metric_label"]),
                Paragraph("Emails Received", S["metric_label"]),
                Paragraph("AI Cost (USD)", S["metric_label"]),
            ],
        ]

        kpi_table = Table(kpi_data, colWidths=[4.25 * cm] * 4)
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BRAND_LIGHT),
            ("BACKGROUND", (0, 2), (-1, 2), BRAND_LIGHT),
            ("BOX",        (0, 0), (-1, 1), 0.5, colors.HexColor("#E2E8F0")),
            ("BOX",        (0, 2), (-1, 3), 0.5, colors.HexColor("#E2E8F0")),
            ("ROWBACKGROUNDS", (0, 0), (-1, 3), [BRAND_LIGHT, colors.white]),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 0.6 * cm))

        # ── Applications chart ───────────────────────────────────────────────
        if m["applications_submitted"] > 0:
            story.append(Paragraph("Applications Breakdown", S["h2"]))

            app_labels = ["Accepted", "Rejected", "In Progress"]
            app_values = [
                m["applications_accepted"],
                m["applications_rejected"],
                m["applications_in_progress"],
            ]
            if sum(app_values) > 0:
                png = _donut_chart(app_values, app_labels, "Application Status Distribution")
                story.append(_chart_image(png, width_cm=10, height_cm=6))
                story.append(Paragraph("Application status breakdown for the period.", S["caption"]))
            story.append(Spacer(1, 0.4 * cm))

        # ── Deadlines ────────────────────────────────────────────────────────
        if m["deadlines_total"] > 0:
            story.append(Paragraph("Deadline Completion", S["h2"]))

            dl_labels = ["Completed", "Missed"]
            dl_values = [m["deadlines_completed"], m["deadlines_missed"]]
            if sum(dl_values) > 0:
                png = _bar_chart(
                    dl_labels, dl_values,
                    "Deadline Completion", "Count",
                    color=MPL_GREEN,
                )
                story.append(_chart_image(png, width_cm=10, height_cm=5))
            story.append(Spacer(1, 0.4 * cm))

        # ── AI Token Usage chart ─────────────────────────────────────────────
        story.append(Paragraph("AI Token Usage", S["h2"]))

        if m["ai_tokens_used"] > 0 and any(t > 0 for t in m["daily_tokens"]):
            png = _bar_chart(
                m["daily_labels"],
                m["daily_tokens"],
                "Daily AI Token Consumption",
                "Tokens",
                color=MPL_BLUE,
            )
            story.append(_chart_image(png, width_cm=16, height_cm=6))
            story.append(Paragraph(
                f"Total: {m['ai_tokens_used']:,} tokens  ·  Estimated cost: ${m['ai_cost_usd']:.4f} USD",
                S["caption"],
            ))
        else:
            story.append(Paragraph("No AI usage recorded in this period.", S["body"]))

        story.append(Spacer(1, 0.4 * cm))

        # ── AI by agent table ────────────────────────────────────────────────
        if m["ai_by_agent"]:
            story.append(Paragraph("AI Usage by Agent", S["h3"]))
            agent_rows = [["Agent", "Tokens Used", "% of Total"]]
            total = max(m["ai_tokens_used"], 1)
            for agent, tokens in sorted(m["ai_by_agent"].items(), key=lambda x: -x[1]):
                agent_rows.append([
                    agent.replace("_", " ").title(),
                    f"{tokens:,}",
                    f"{tokens/total*100:.1f}%",
                ])

            agent_table = Table(agent_rows, colWidths=[7 * cm, 4 * cm, 3.5 * cm])
            agent_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
                ("TEXTCOLOR",  (0, 0), (-1, 0), WHITE),
                ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE",   (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRAND_LIGHT, colors.white]),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5E1")),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("TOPPADDING",    (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(agent_table)
            story.append(Spacer(1, 0.4 * cm))

        # ── Email summary ────────────────────────────────────────────────────
        if m["emails_received"] > 0 and m["email_categories"]:
            story.append(Paragraph("Email Activity", S["h2"]))
            cat_labels = list(m["email_categories"].keys())
            cat_values = [m["email_categories"][k] for k in cat_labels]
            png = _donut_chart(cat_values, [l.replace("_", " ").title() for l in cat_labels], "Email Categories")
            story.append(_chart_image(png, width_cm=10, height_cm=5.5))
            story.append(Paragraph(
                f"{m['emails_received']} emails received  ·  {m['emails_urgent']} urgent",
                S["caption"],
            ))

        # ── Footer ───────────────────────────────────────────────────────────
        story.append(Spacer(1, 0.8 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0")))
        story.append(Paragraph(
            f"Generated by ApplyPilot on {datetime.now(timezone.utc).strftime('%d %b %Y at %H:%M UTC')}",
            S["right"],
        ))

        doc.build(story)
        buf.seek(0)
        return buf.read()

    async def _send_agency_telegram(
        self,
        agency_id: str,
        agency_name: str,
        report_type: str,
        period_label: str,
        m: dict,
        pdf_url: Optional[str],
    ) -> None:
        try:
            from services.telegram_bot import send_alert_to_staff

            pdf_link = f"\n[📥 Download PDF]({pdf_url})" if pdf_url else ""
            msg = (
                f"📊 *{report_type.capitalize()} Report — {agency_name}*\n"
                f"📅 {period_label}\n"
                f"━━━━━━━━━━━━━━━\n"
                f"👥 Students: {m['total_students']} total, {m['new_students']} new\n"
                f"📋 Applications: {m['applications_submitted']} submitted, {m['acceptance_rate_pct']}% accepted\n"
                f"✅ Deadlines: {m['deadlines_completed']}/{m['deadlines_total']} completed\n"
                f"📧 Emails: {m['emails_received']} received, {m['emails_urgent']} urgent\n"
                f"🤖 AI Cost: ${m['ai_cost_usd']:.4f} ({m['ai_tokens_used']:,} tokens){pdf_link}"
            )
            await send_alert_to_staff(agency_id=agency_id, message=msg)
        except Exception as exc:
            logger.error(f"Reporter: Telegram agency report send failed: {exc}")

    # ── Platform report internals ───────────────────────────────────────────

    async def _generate_platform_report(self, report_type: str) -> None:
        db = get_service_client()
        period_start, period_end, period_label = _period_bounds(report_type)
        start_iso = period_start.isoformat()
        end_iso   = (period_end + timedelta(days=1)).isoformat()

        # Fetch global metrics
        agencies = db.table("agencies").select("id, name, ai_tokens_used").execute()
        all_agencies = agencies.data or []

        students = db.table("students").select("id, created_at").gte("created_at", start_iso).lt("created_at", end_iso).execute()
        apps = db.table("applications").select("id, status").gte("created_at", start_iso).lt("created_at", end_iso).execute()
        ai_logs = db.table("ai_usage_logs").select("agency_id, tokens_spent, cost_usd, timestamp").gte("timestamp", start_iso).lt("timestamp", end_iso).execute()

        ai_data = ai_logs.data or []
        total_tokens = sum(r.get("tokens_spent", 0) for r in ai_data)
        total_cost   = round(sum(float(r.get("cost_usd", 0)) for r in ai_data), 4)

        # Per-agency token breakdown
        agency_tokens: dict = {}
        for r in ai_data:
            aid = r["agency_id"]
            agency_tokens[aid] = agency_tokens.get(aid, 0) + r.get("tokens_spent", 0)

        # Daily totals
        days = (period_end - period_start).days + 1
        daily_labels = [(period_start + timedelta(days=i)).strftime("%m/%d") for i in range(min(days, 31))]
        daily_tokens = [0] * len(daily_labels)
        for r in ai_data:
            ts = r.get("timestamp", "")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
                    idx = (dt - period_start).days
                    if 0 <= idx < len(daily_tokens):
                        daily_tokens[idx] += r.get("tokens_spent", 0)
                except Exception:
                    pass

        # Build summary
        summary = {
            "total_agencies": len(all_agencies),
            "new_students_period": len(students.data or []),
            "applications_period": len(apps.data or []),
            "total_tokens": total_tokens,
            "total_cost_usd": total_cost,
            "agency_tokens": {
                ag["name"]: agency_tokens.get(ag["id"], 0)
                for ag in all_agencies
            },
            "daily_labels": daily_labels,
            "daily_tokens": daily_tokens,
        }

        pdf_bytes = self._build_platform_pdf(report_type, period_label, period_start, period_end, summary)

        r2_path = f"reports/platform/{report_type}/{period_label.replace(' ', '_')}.pdf"
        try:
            pdf_url = _upload_pdf_to_r2(pdf_bytes, r2_path)
        except Exception as exc:
            logger.error(f"Reporter: R2 platform upload failed: {exc}")
            pdf_url = None

        db.table("reports").insert({
            "agency_id": None,
            "scope": "platform",
            "report_type": report_type,
            "period_label": period_label,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "summary_json": {
                "total_agencies": summary["total_agencies"],
                "new_students_period": summary["new_students_period"],
                "applications_period": summary["applications_period"],
                "total_tokens": summary["total_tokens"],
                "total_cost_usd": summary["total_cost_usd"],
            },
            "pdf_storage_path": r2_path,
            "pdf_url": pdf_url,
            "telegram_sent": False,
        }).execute()

        # Alert super admin
        try:
            from services.telegram_bot import send_message_to_super_admin
            pdf_link = f"\n[📥 Download PDF]({pdf_url})" if pdf_url else ""
            msg = (
                f"📊 *Platform {report_type.capitalize()} Report*\n"
                f"📅 {period_label}\n"
                f"━━━━━━━━━━━━━━━\n"
                f"🏢 Agencies: {summary['total_agencies']}\n"
                f"👥 New Students: {summary['new_students_period']}\n"
                f"📋 Applications: {summary['applications_period']}\n"
                f"🤖 AI Tokens: {summary['total_tokens']:,} (${summary['total_cost_usd']:.4f}){pdf_link}"
            )
            await send_message_to_super_admin(msg)
        except Exception as exc:
            logger.error(f"Reporter: super admin Telegram send failed: {exc}")

    def _build_platform_pdf(
        self,
        report_type: str,
        period_label: str,
        period_start: date,
        period_end: date,
        m: dict,
    ) -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                leftMargin=2*cm, rightMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        S = _get_styles()
        story = []

        # Header
        story.append(Paragraph("ApplyPilot", S["h1"]))
        story.append(Paragraph(
            f"Platform {report_type.capitalize()} Report",
            ParagraphStyle("sub", fontSize=13, textColor=GREY, fontName="Helvetica"),
        ))
        story.append(Paragraph(
            f"{period_label}  ·  {period_start.strftime('%d %b %Y')} – {period_end.strftime('%d %b %Y')}",
            ParagraphStyle("dates", fontSize=9, textColor=GREY),
        ))
        story.append(Spacer(1, 0.3 * cm))
        story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE))
        story.append(Spacer(1, 0.5 * cm))

        # KPI row
        kpi_data = [
            [
                Paragraph(f"{m['total_agencies']}", S["metric_value"]),
                Paragraph(f"{m['new_students_period']}", S["metric_value"]),
                Paragraph(f"{m['applications_period']}", S["metric_value"]),
                Paragraph(f"${m['total_cost_usd']:.2f}", S["metric_value"]),
            ],
            [
                Paragraph("Agencies", S["metric_label"]),
                Paragraph("New Students", S["metric_label"]),
                Paragraph("Applications", S["metric_label"]),
                Paragraph("AI Cost (USD)", S["metric_label"]),
            ],
        ]
        kpi_table = Table(kpi_data, colWidths=[4.25 * cm] * 4)
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BRAND_LIGHT),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 0.6 * cm))

        # Daily AI burn chart
        if any(t > 0 for t in m["daily_tokens"]):
            story.append(Paragraph("Daily AI Token Burn", S["h2"]))
            png = _bar_chart(m["daily_labels"], m["daily_tokens"],
                             "Platform-wide Daily Token Consumption", "Tokens")
            story.append(_chart_image(png, width_cm=16, height_cm=6))
            story.append(Paragraph(
                f"Total: {m['total_tokens']:,} tokens  ·  ${m['total_cost_usd']:.4f} USD",
                S["caption"],
            ))
            story.append(Spacer(1, 0.4 * cm))

        # Per-agency breakdown
        if m["agency_tokens"]:
            story.append(Paragraph("Per-Agency Token Consumption", S["h2"]))

            ag_names  = list(m["agency_tokens"].keys())
            ag_tokens = [m["agency_tokens"][n] for n in ag_names]

            if any(t > 0 for t in ag_tokens):
                png = _donut_chart(ag_tokens, ag_names, "Token Usage by Agency")
                story.append(_chart_image(png, width_cm=10, height_cm=6))

            # Table
            rows = [["Agency", "Tokens Used", "Cost (USD)"]]
            total = max(m["total_tokens"], 1)
            _price = 0.00000015 + 0.0000006 / 2  # blended approx
            for name, tokens in sorted(m["agency_tokens"].items(), key=lambda x: -x[1]):
                rows.append([name, f"{tokens:,}", f"${tokens * _price:.4f}"])

            t = Table(rows, colWidths=[8 * cm, 4.5 * cm, 4.5 * cm - 1 * mm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
                ("TEXTCOLOR",  (0, 0), (-1, 0), WHITE),
                ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE",   (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRAND_LIGHT, colors.white]),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5E1")),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("TOPPADDING",    (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(t)

        # Footer
        story.append(Spacer(1, 0.8 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0")))
        story.append(Paragraph(
            f"Generated by ApplyPilot on {datetime.now(timezone.utc).strftime('%d %b %Y at %H:%M UTC')}",
            S["right"],
        ))

        doc.build(story)
        buf.seek(0)
        return buf.read()
