from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class CropBase(BaseModel):
    crop_type: str
    variety: Optional[str] = None
    season: Optional[str] = None
    sowing_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    growth_stage: str = "Sown"
    status: str = "active"
    area_acres: float = Field(default=0, ge=0)
    notes: Optional[str] = None


class CropCreate(CropBase):
    farm_id: int


class CropUpdate(BaseModel):
    crop_type: Optional[str] = None
    variety: Optional[str] = None
    season: Optional[str] = None
    sowing_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    growth_stage: Optional[str] = None
    status: Optional[str] = None
    area_acres: Optional[float] = None
    notes: Optional[str] = None


class CropOut(CropBase):
    id: int
    farm_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
