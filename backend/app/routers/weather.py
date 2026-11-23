"""
Weather Intelligence Module endpoints - Section 9.
Also triggers the weather-driven alert workflow (Section 15) on demand.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_accessible_farm_or_404, get_current_user
from app.models.user import User
from app.schemas.weather import WeatherResponse
from app.services.weather_service import get_weather
from app.services.automation_service import run_weather_alert_workflow

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("/farm/{farm_id}", response_model=WeatherResponse)
def farm_weather(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = get_accessible_farm_or_404(db, farm_id, user)
    return get_weather(farm.location_text)


@router.post("/farm/{farm_id}/check-alerts")
def check_alerts(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = get_accessible_farm_or_404(db, farm_id, user)
    alert = run_weather_alert_workflow(db, farm)
    return {"alert_created": alert is not None, "alert": alert}
