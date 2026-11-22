from datetime import datetime
from pydantic import BaseModel


class AlertOut(BaseModel):
    id: int
    farm_id: int
    alert_type: str
    severity: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
