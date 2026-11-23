"""
Notification and Alert System - Section 14.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import can_access_all_farms, get_accessible_farm_or_404, get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.alert import Alert
from app.schemas.alert import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(farm_id: int | None = None, unread_only: bool = False,
                 db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Alert).join(Farm)
    if farm_id is not None:
        get_accessible_farm_or_404(db, farm_id, user)
        query = query.filter(Alert.farm_id == farm_id)
    elif not can_access_all_farms(user):
        query = query.filter(Farm.owner_id == user.id)
    if unread_only:
        query = query.filter(Alert.is_read == False)  # noqa: E712
    return query.order_by(Alert.created_at.desc()).all()


@router.patch("/{alert_id}/read", response_model=AlertOut)
def mark_read(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    get_accessible_farm_or_404(db, alert.farm_id, user)
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert
