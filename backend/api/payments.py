"""
Payment Flags API — Phase 4I
Tracks paused workflow steps that need manual payment.

Endpoints:
  GET  /api/payments?workflow_id=          — list payment flags
  POST /api/payments/{id}/mark-paid        — coordinator confirms payment done
  POST /api/payments/{id}/waive            — mark fee as waived
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Payments"])


@router.get("/payments")
async def list_payments(workflow_id: Optional[str] = None, student_id: Optional[str] = None, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    query = db.table("payment_flags").select("*").eq("agency_id", user.agency_id)
    if workflow_id:
        query = query.eq("workflow_id", workflow_id)
    if student_id:
        query = query.eq("student_id", student_id)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


class PaymentAction(BaseModel):
    notes: Optional[str] = None


@router.post("/payments/{payment_id}/mark-paid")
async def mark_paid(payment_id: str, body: PaymentAction, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    payment = db.table("payment_flags").select("*").eq("id", payment_id).eq("agency_id", user.agency_id).single().execute()
    if not payment.data:
        raise HTTPException(404, "Payment flag not found")
    if payment.data['status'] != 'pending':
        raise HTTPException(400, "Payment already resolved")

    db.table("payment_flags").update({
        "status": "paid",
        "marked_paid_by": user.id,
        "marked_paid_at": datetime.now(timezone.utc).isoformat(),
        "notes": body.notes,
    }).eq("id", payment_id).execute()

    # Resume the paused workflow step
    if payment.data.get('step_id'):
        db.table("automation_steps").update({"status": "queued"}).eq("id", payment.data['step_id']).execute()
        db.table("automation_workflows").update({"status": "running"}).eq("id", payment.data['workflow_id']).execute()

    return {"success": True}


@router.post("/payments/{payment_id}/waive")
async def waive_payment(payment_id: str, body: PaymentAction, user: AuthUser = Depends(get_current_user)):
    db = get_service_client()
    payment = db.table("payment_flags").select("*").eq("id", payment_id).eq("agency_id", user.agency_id).single().execute()
    if not payment.data:
        raise HTTPException(404, "Payment flag not found")

    db.table("payment_flags").update({
        "status": "waived",
        "marked_paid_by": user.id,
        "marked_paid_at": datetime.now(timezone.utc).isoformat(),
        "notes": body.notes,
    }).eq("id", payment_id).execute()

    return {"success": True}
