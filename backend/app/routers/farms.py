"""
Farm Management - Section 7.2.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmUpdate, FarmOut

router = APIRouter(prefix="/api/farms", tags=["Farms"])


def _owned_farm_or_404(db: Session, farm_id: int, user: User) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
    if farm.owner_id != user.id and user.role not in ("admin", "agronomist", "researcher"):
        raise HTTPException(status_code=403, detail="You do not have access to this farm.")
    return farm


@router.get("", response_model=list[FarmOut])
def list_farms(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role in ("admin", "agronomist", "researcher"):
        return db.query(Farm).all()
    return db.query(Farm).filter(Farm.owner_id == user.id).all()


@router.post("", response_model=FarmOut, status_code=201)
def create_farm(payload: FarmCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = Farm(owner_id=user.id, **payload.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _owned_farm_or_404(db, farm_id, user)


@router.patch("/{farm_id}", response_model=FarmOut)
def update_farm(farm_id: int, payload: FarmUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = _owned_farm_or_404(db, farm_id, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(farm, key, value)
    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/{farm_id}", status_code=204)
def delete_farm(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = _owned_farm_or_404(db, farm_id, user)
    db.delete(farm)
    db.commit()
    return None
