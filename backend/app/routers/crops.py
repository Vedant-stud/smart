"""
Crop Management - Section 7.3. Also triggers the growth-stage-change
workflow automation from Section 15 when growth_stage is updated.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import can_access_all_farms, get_accessible_farm_or_404, get_current_user
from app.models.user import User
from app.models.crop import Crop
from app.models.farm import Farm
from app.schemas.crop import CropCreate, CropUpdate, CropOut
from app.services.automation_service import run_growth_stage_followup

router = APIRouter(prefix="/api/crops", tags=["Crops"])


@router.get("", response_model=list[CropOut])
def list_crops(farm_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Crop).join(Farm)
    if farm_id is not None:
        get_accessible_farm_or_404(db, farm_id, user)
    if not can_access_all_farms(user):
        query = query.filter(Farm.owner_id == user.id)
    if farm_id is not None:
        query = query.filter(Crop.farm_id == farm_id)
    return query.all()


@router.post("", response_model=CropOut, status_code=201)
def create_crop(payload: CropCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_accessible_farm_or_404(db, payload.farm_id, user)
    crop = Crop(**payload.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.get("/{crop_id}", response_model=CropOut)
def get_crop(crop_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found.")
    get_accessible_farm_or_404(db, crop.farm_id, user)
    return crop


@router.patch("/{crop_id}", response_model=CropOut)
def update_crop(crop_id: int, payload: CropUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found.")
    get_accessible_farm_or_404(db, crop.farm_id, user)

    updates = payload.model_dump(exclude_unset=True)
    stage_changed = "growth_stage" in updates and updates["growth_stage"] != crop.growth_stage
    for key, value in updates.items():
        setattr(crop, key, value)
    db.commit()
    db.refresh(crop)

    if stage_changed:
        run_growth_stage_followup(db, crop)

    return crop


@router.delete("/{crop_id}", status_code=204)
def delete_crop(crop_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found.")
    get_accessible_farm_or_404(db, crop.farm_id, user)
    db.delete(crop)
    db.commit()
    return None
