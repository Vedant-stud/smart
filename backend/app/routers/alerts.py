"""
Notification and Alert System - Section 14.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(farm_id: int | None = None, unread_only: bool = False,
                 db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Alert)
    if farm_id:
        query = query.filter(Alert.farm_id == farm_id)
    if unread_only:
        query = query.filter(Alert.is_read == False)  # noqa: E712
    return query.order_by(Alert.created_at.desc()).all()


@router.patch("/{alert_id}/read", response_model=AlertOut)
def mark_read(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert
