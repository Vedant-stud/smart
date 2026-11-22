from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TaskCreate(BaseModel):
    farm_id: int
    crop_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: str = "general"
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None


class TaskOut(BaseModel):
    id: int
    farm_id: int
    crop_id: Optional[int]
    title: str
    description: Optional[str]
    category: str
    due_date: Optional[datetime]
    is_completed: bool
    auto_generated: bool
    created_at: datetime

    class Config:
        from_attributes = True
