"""
Crop Disease Detection - Section 12.
"""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_accessible_farm_or_404, get_current_user
from app.models.user import User
from app.models.recommendation import Recommendation
from app.schemas.disease import DiseaseDetectionResult
from app.services.vision_service import classify_leaf_image

router = APIRouter(prefix="/api/disease", tags=["Disease Detection"])


@router.post("/detect", response_model=DiseaseDetectionResult)
async def detect(farm_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_accessible_farm_or_404(db, farm_id, user)
    image_bytes = await file.read()
    result = classify_leaf_image(image_bytes, file.filename or "upload")

    rec = Recommendation(
        farm_id=farm_id, category="disease",
        title=f"Leaf image analysis: {result['predicted_condition']}",
        body="\n".join(result["suggested_next_steps"]),
        reasoning=result["description"],
        confidence=f"{round(result['confidence'] * 100)}%",
        source="vision_model",
    )
    db.add(rec)
    db.commit()

    return DiseaseDetectionResult(**result)
