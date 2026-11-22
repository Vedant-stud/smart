"""
Analytics Dashboard - Section 13.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics_service import build_summary

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return build_summary(db, user.id, is_admin=(user.role == "admin"))
