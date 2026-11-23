"""
Soil and Fertilizer Analysis - Section 11.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_accessible_farm_or_404, get_current_user
from app.models.user import User
from app.models.soil import SoilRecord
from app.models.recommendation import Recommendation
from app.schemas.soil import SoilRecordCreate, SoilRecordOut, SoilAnalysisResult
from app.services.recommendation_service import analyze_soil

router = APIRouter(prefix="/api/soil", tags=["Soil"])


@router.post("/records", response_model=SoilRecordOut, status_code=201)
def create_soil_record(payload: SoilRecordCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_accessible_farm_or_404(db, payload.farm_id, user)
    record = SoilRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/records", response_model=list[SoilRecordOut])
def list_soil_records(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_accessible_farm_or_404(db, farm_id, user)
    return db.query(SoilRecord).filter(SoilRecord.farm_id == farm_id).order_by(SoilRecord.recorded_at.desc()).all()


@router.post("/analyze", response_model=SoilAnalysisResult)
def analyze(payload: SoilRecordCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_accessible_farm_or_404(db, payload.farm_id, user)
    result = analyze_soil(payload.ph, payload.nitrogen_kg_ha, payload.phosphorus_kg_ha,
                           payload.potassium_kg_ha, payload.organic_carbon_pct, payload.moisture_pct)
    rec = Recommendation(
        farm_id=payload.farm_id, category="fertilizer",
        title="Soil & Fertilizer Analysis",
        body="\n".join(result["suggestions"]),
        reasoning="\n".join(result["concerns"]),
        confidence="Medium", source="rule_engine",
    )
    db.add(rec)
    db.commit()
    return SoilAnalysisResult(farm_id=payload.farm_id, concerns=result["concerns"], suggestions=result["suggestions"])
