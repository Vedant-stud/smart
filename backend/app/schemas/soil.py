from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SoilRecordCreate(BaseModel):
    farm_id: int
    ph: Optional[float] = None
    nitrogen_kg_ha: Optional[float] = None
    phosphorus_kg_ha: Optional[float] = None
    potassium_kg_ha: Optional[float] = None
    organic_carbon_pct: Optional[float] = None
    moisture_pct: Optional[float] = None


class SoilRecordOut(SoilRecordCreate):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True


class SoilAnalysisResult(BaseModel):
    farm_id: int
    concerns: list[str]
    suggestions: list[str]
    disclaimer: str = (
        "This analysis is AI-generated decision support based on the values "
        "provided. Consult a certified agronomist or locally approved "
        "guidelines before making high-impact fertilizer or amendment decisions."
    )
