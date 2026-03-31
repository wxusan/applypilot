from fastapi import APIRouter, Depends
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
