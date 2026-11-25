"""Dashboard routes for statistics and monitoring."""

from fastapi import APIRouter
from database.db import get_dashboard_stats

router = APIRouter()


@router.get("/dashboard/stats")
async def dashboard_stats():
    """Get dashboard statistics."""
    stats = await get_dashboard_stats()
    return {"success": True, "data": stats}
