from typing import List
from pydantic import BaseModel


class ChartPoint(BaseModel):
    label: str
    value: float


class AnalyticsSummary(BaseModel):
    active_farms: int
    active_crops: int
    total_area_acres: float
    open_tasks: int
    unread_alerts: int
    crop_distribution: List[ChartPoint]
    growth_stage_distribution: List[ChartPoint]
    irrigation_activity: List[ChartPoint]
    monthly_task_completion: List[ChartPoint]
