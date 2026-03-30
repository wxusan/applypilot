"""
College Search API — Phase 3.

GET /colleges — search college_profiles table with optional filters
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List

from core.auth import get_current_user
from core.db import get_service_client
from models.user import AuthUser

router = APIRouter(tags=["Colleges"])


@router.get("/colleges")
async def search_colleges(
    q: Optional[str] = Query(None, description="Search by college name (case-insensitive)"),
    min_rank: Optional[int] = Query(None, description="Minimum US News rank (inclusive)"),
    max_rank: Optional[int] = Query(None, description="Maximum US News rank (inclusive)"),
    max_acceptance_rate: Optional[float] = Query(None, description="Maximum acceptance rate (0-1)"),
    state: Optional[str] = Query(None, description="Filter by state (e.g., 'CA', 'NY')"),
    limit: int = Query(20, ge=1, le=50, description="Number of results (default 20, max 50)"),
    user: AuthUser = Depends(get_current_user),
):
    """
    Search college_profiles table with optional filters.
    No agency isolation needed (college_profiles is a public reference table).
    Returns list of colleges with key metadata fields.
    """
    db = get_service_client()

    query = db.table("college_profiles").select(
        "id, name, location_city, location_state, us_news_rank, acceptance_rate, "
        "avg_gpa, avg_sat, avg_act, tuition_out_state, application_fee, "
        "early_decision_deadline, regular_decision_deadline, website_url"
    )

    # Apply filters
    if q:
        query = query.ilike("name", f"%{q}%")

    if min_rank is not None:
        query = query.gte("us_news_rank", min_rank)

    if max_rank is not None:
        query = query.lte("us_news_rank", max_rank)

    if max_acceptance_rate is not None:
        # Ensure the value is between 0 and 1
        if max_acceptance_rate < 0 or max_acceptance_rate > 1:
            raise HTTPException(400, "max_acceptance_rate must be between 0 and 1")
        query = query.lte("acceptance_rate", max_acceptance_rate)

    if state:
        query = query.eq("location_state", state)

    # Order by rank if no search query, otherwise by relevance
    result = query.order("us_news_rank", desc=False).limit(limit).execute()

    return {"colleges": result.data or []}
