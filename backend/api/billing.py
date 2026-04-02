from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Billing"], prefix="/settings/billing")

@router.get("/")
async def get_agency_billing_status(user: AuthUser = Depends(get_current_user)):
    """Fetches the active payload state of the tenant's AI usage compared against total quotas."""
    db = get_service_client()

    # Get primary usage numbers
    agency_res = db.table("agencies").select("ai_tokens_used, ai_token_limit, subscription_plan").eq("id", user.agency_id).single().execute()
    agency = agency_res.data or {}

    # Gather last 7 days of raw burns to map a chart widget for the client
    logs_res = db.table("ai_usage_logs").select("agent_type, cost_usd, timestamp").eq("agency_id", user.agency_id).order("timestamp", desc=True).limit(50).execute()

    return {
        "status": "active" if agency.get("ai_tokens_used", 0) < agency.get("ai_token_limit", 500000) else "suspended",
        "tokens_used": agency.get("ai_tokens_used", 0),
        "token_limit": agency.get("ai_token_limit", 500000),
        "subscription_plan": agency.get("subscription_plan", "starter"),
        "recent_activity": logs_res.data,
        "user_role": user.role,
    }


@router.get("/tokens")
async def get_token_usage_detail(user: AuthUser = Depends(get_current_user)):
    """Detailed token usage breakdown for the token analytics dashboard."""
    db = get_service_client()

    # Agency totals
    agency_res = db.table("agencies").select("ai_tokens_used, ai_token_limit, subscription_plan").eq("id", user.agency_id).single().execute()
    agency = agency_res.data or {}

    # Get last 30 days of logs
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    logs_res = db.table("ai_usage_logs").select("*").eq("agency_id", user.agency_id).gte("timestamp", cutoff).order("timestamp", desc=True).execute()
    logs = logs_res.data or []

    # Daily breakdown for last 7 days chart
    daily: dict = defaultdict(int)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    for log in logs:
        ts = log.get("timestamp", "")
        if ts:
            try:
                log_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if log_dt >= seven_days_ago:
                    daily[ts[:10]] += log.get("tokens_spent", 0)
            except ValueError:
                pass

    daily_chart = []
    for i in range(6, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_chart.append({"day": day, "tokens": daily.get(day, 0)})

    # Breakdown by agent type (30 days)
    by_type: dict = defaultdict(int)
    for log in logs:
        by_type[log.get("agent_type", "unknown")] += log.get("tokens_spent", 0)

    # Recent transactions (last 20)
    recent = [
        {
            "id": log.get("id", ""),
            "timestamp": log.get("timestamp", ""),
            "agent_type": log.get("agent_type", ""),
            "tokens_spent": log.get("tokens_spent", 0),
            "cost_usd": float(log.get("cost_usd") or 0),
            "model_name": log.get("model_name", ""),
        }
        for log in logs[:20]
    ]

    return {
        "tokens_used": agency.get("ai_tokens_used", 0),
        "token_limit": agency.get("ai_token_limit", 1500000),
        "subscription_plan": agency.get("subscription_plan", "starter"),
        "daily_chart": daily_chart,
        "by_agent_type": dict(by_type),
        "recent_transactions": recent,
        "total_transactions": len(logs),
    }


@router.get("/agencies")
async def get_all_agency_billing(user: AuthUser = Depends(get_current_user)):
    """Super-admin only: list all agencies with billing status."""
    if user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")

    db = get_service_client()
    result = db.table("agencies").select(
        "id, name, subscription_plan, ai_tokens_used, ai_token_limit, created_at"
    ).order("name").execute()

    agencies = result.data or []

    def initials(name: str) -> str:
        words = (name or "?").split()
        return "".join(w[0].upper() for w in words[:2]) if words else "?"

    return [
        {
            "id": a["id"],
            "agency_name": a.get("name") or "Unknown",
            "agency_initials": initials(a.get("name") or ""),
            "tier": (a.get("subscription_plan") or "starter").capitalize(),
            "tokens_used": a.get("ai_tokens_used", 0),
            "token_limit": a.get("ai_token_limit", 0),
            "outstanding": 0,
            "status": "active",
        }
        for a in agencies
    ]
