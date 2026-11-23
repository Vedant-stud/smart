"""
AI Crop Recommendation + Smart Irrigation endpoints - Sections 7.4 and 10.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_accessible_farm_or_404, get_current_user
from app.models.user import User
from app.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationOut
from app.services.recommendation_service import recommend_crops, irrigation_recommendation
from app.services.weather_service import get_weather

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/crop-selection/{farm_id}")
def crop_selection(farm_id: int, season: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = get_accessible_farm_or_404(db, farm_id, user)
    results = recommend_crops(farm.soil_type or "loamy", farm.irrigation_available, season)

    if results:
        top = results[0]
        rec = Recommendation(
            farm_id=farm.id, category="crop_selection",
            title=f"Suggested crop: {top['crop']}",
            body=f"{top['crop']} is the top-ranked suitable crop for this farm's conditions.",
            reasoning=top["reasoning"], confidence=top["confidence"], source="rule_engine",
        )
        db.add(rec)
        db.commit()

    return {"farm_id": farm_id, "recommendations": results}


@router.get("/irrigation/{farm_id}")
def irrigation(farm_id: int, crop_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = get_accessible_farm_or_404(db, farm_id, user)
    weather = get_weather(farm.location_text)

    crop_type, growth_stage = "the crop", "Vegetative"
    if crop_id is not None:
        from app.models.crop import Crop
        crop = db.query(Crop).filter(Crop.id == crop_id).first()
        if crop is None or crop.farm_id != farm.id:
            raise HTTPException(status_code=404, detail="Crop not found for this farm.")
        crop_type, growth_stage = crop.crop_type, crop.growth_stage

    result = irrigation_recommendation(weather.current.rain_probability_pct, growth_stage, crop_type)

    rec = Recommendation(
        farm_id=farm.id, category="irrigation",
        title=f"Irrigation: {result['action']}",
        body=f"Recommended action: {result['action']}.",
        reasoning=result["reasoning"], confidence="High", source="rule_engine",
    )
    db.add(rec)
    db.commit()

    return {"farm_id": farm_id, "crop_type": crop_type, "growth_stage": growth_stage, **result}


@router.get("", response_model=list[RecommendationOut])
def list_recommendations(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_accessible_farm_or_404(db, farm_id, user)
    return db.query(Recommendation).filter(Recommendation.farm_id == farm_id).order_by(Recommendation.created_at.desc()).all()
