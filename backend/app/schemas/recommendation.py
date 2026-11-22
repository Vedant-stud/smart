from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RecommendationOut(BaseModel):
    id: int
    farm_id: int
    category: str
    title: str
    body: str
    reasoning: Optional[str]
    confidence: Optional[str]
    source: str
    created_at: datetime

    class Config:
        from_attributes = True
