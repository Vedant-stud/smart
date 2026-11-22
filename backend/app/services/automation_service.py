"""
Workflow Automation - Section 15 of the abstract.

Example workflow implemented here:
    Weather Forecast -> Rule Evaluation -> Rain Probability Above Threshold
    -> Create Alert -> Notify Farmer

And: when a crop's growth_stage is updated, automatically create a
follow-up task with a due date, per Section 15's second example
("update tasks automatically when a crop growth stage changes").

In production this would run as a scheduled Celery beat job polling
weather + farm data; it is exposed here as plain functions that the
routers call synchronously so the whole workflow is demoable without
standing up a separate worker process.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.task import Task
from app.services.weather_service import get_weather

RAIN_ALERT_THRESHOLD = 60.0

STAGE_FOLLOWUPS = {
    "Germination": ("Check germination rate", "general", 3),
    "Vegetative": ("Apply top-dressing fertilizer", "fertilizer", 5),
    "Flowering": ("Monitor for pest/disease pressure during flowering", "pest", 3),
    "Grain-filling": ("Reduce irrigation frequency ahead of maturity", "irrigation", 7),
    "Maturity": ("Plan harvest logistics", "harvest", 5),
}


def run_weather_alert_workflow(db: Session, farm) -> Alert | None:
    """Weather Forecast -> Rule Evaluation -> Rain Probability Above
    Threshold -> Create Alert -> Notify Farmer."""
    weather = get_weather(farm.location_text)
    if weather.current.rain_probability_pct > RAIN_ALERT_THRESHOLD:
        alert = Alert(
            farm_id=farm.id,
            alert_type="rainfall",
            severity="warning",
            title="High rainfall probability - review irrigation plan",
            message=(
                f"{weather.current.rain_probability_pct}% chance of rain in the next 24 hours "
                f"for {farm.location_text}. Consider postponing scheduled irrigation."
            ),
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert
    return None


def run_growth_stage_followup(db: Session, crop) -> Task | None:
    """Auto-creates a follow-up task when a crop's growth stage changes."""
    followup = STAGE_FOLLOWUPS.get(crop.growth_stage)
    if not followup:
        return None
    title, category, days_ahead = followup
    task = Task(
        farm_id=crop.farm_id,
        crop_id=crop.id,
        title=f"{title} ({crop.crop_type})",
        description=f"Auto-generated after {crop.crop_type} entered the {crop.growth_stage} stage.",
        category=category,
        due_date=datetime.now(timezone.utc) + timedelta(days=days_ahead),
        auto_generated=True,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
