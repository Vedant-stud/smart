from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FarmBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    location_text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_acres: float = Field(ge=0)
    soil_type: Optional[str] = None
    irrigation_available: bool = False
    irrigation_source: Optional[str] = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    irrigation_available: Optional[bool] = None
    irrigation_source: Optional[str] = None


class FarmOut(FarmBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
