import logging
from fastapi import HTTPException
from core.db import get_service_client

logger = logging.getLogger(__name__)

async def log_token_usage(agency_id: str, agent_type: str, tokens: int, cost: float, model: str = "gpt-4o-mini"):
    """
    Deducts tokens from the agency's balance and logs the transaction.
    Raises an HTTPException (402 Payment Required) if limits are exceeded to forcefully suspend the agent.
    """
    db = get_service_client()
    
    # 1. Fetch current limits safely
    res = db.table("agencies").select("ai_tokens_used, ai_token_limit").eq("id", agency_id).single().execute()
    if not res.data:
        logger.error(f"Cannot bill tokens. Agency {agency_id} not found.")
        return
        
    current_used = res.data.get("ai_tokens_used", 0)
    token_limit = res.data.get("ai_token_limit", 500000)
    
    # 2. Write immutable metric ledger BEFORE the main update
    # In a full-scale app, this would be a single logical transaction via PostgreSQL procedures.
    db.table("ai_usage_logs").insert({
        "agency_id": agency_id,
        "agent_type": agent_type,
        "tokens_spent": tokens,
        "cost_usd": cost,
        "model_name": model
    }).execute()

    # 3. Add to total and push to database
    new_total = current_used + tokens
    db.table("agencies").update({"ai_tokens_used": new_total}).eq("id", agency_id).execute()
    
    # 4. Agent Hard Limit Check
    if new_total > token_limit:
        logger.warning(f"Agency {agency_id} exceeded AI token limit ({new_total}/{token_limit}). Execution suspended.")
        # Trigger an alert or potentially block execution dynamically by returning False
        raise HTTPException(
            status_code=402, 
            detail="AI Token limit exceeded. Please top-up your SaaS subscription or contact support to continue operations."
        )
