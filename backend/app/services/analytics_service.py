"""
Analytics Dashboard data aggregation - Section 13 of the abstract.
"""
from collections import Counter
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.crop import Crop
from app.models.task import Task
from app.models.alert import Alert
from app.schemas.analytics import AnalyticsSummary, ChartPoint


def build_summary(db: Session, user_id: int, is_admin: bool = False) -> AnalyticsSummary:
    farm_query = db.query(Farm) if is_admin else db.query(Farm).filter(Farm.owner_id == user_id)
    farms = farm_query.all()
    farm_ids = [f.id for f in farms]

    crops = db.query(Crop).filter(Crop.farm_id.in_(farm_ids)).all() if farm_ids else []
    tasks = db.query(Task).filter(Task.farm_id.in_(farm_ids)).all() if farm_ids else []
    alerts = db.query(Alert).filter(Alert.farm_id.in_(farm_ids)).all() if farm_ids else []

    active_crops = [c for c in crops if c.status == "active"]
    crop_type_counts = Counter(c.crop_type for c in active_crops)
    stage_counts = Counter(c.growth_stage for c in active_crops)
    irrigation_counts = Counter("Irrigation" if t.category == "irrigation" else "Other" for t in tasks)

    month_counts = Counter()
    for t in tasks:
        if t.is_completed and t.created_at:
            month_counts[t.created_at.strftime("%b")] += 1

    return AnalyticsSummary(
        active_farms=len(farms),
        active_crops=len(active_crops),
        total_area_acres=round(sum(f.area_acres for f in farms), 2),
        open_tasks=len([t for t in tasks if not t.is_completed]),
        unread_alerts=len([a for a in alerts if not a.is_read]),
        crop_distribution=[ChartPoint(label=k, value=v) for k, v in crop_type_counts.items()],
        growth_stage_distribution=[ChartPoint(label=k, value=v) for k, v in stage_counts.items()],
        irrigation_activity=[ChartPoint(label=k, value=v) for k, v in irrigation_counts.items()],
        monthly_task_completion=[ChartPoint(label=k, value=v) for k, v in month_counts.items()],
    )
