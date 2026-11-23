"""
Shared FastAPI dependencies: current user resolution and role guards.
Implements role-based access control (Section 18): admin, farmer,
agronomist, researcher.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.farm import Farm
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
FARM_WIDE_ACCESS_ROLES = {"admin", "agronomist", "researcher"}


def can_access_all_farms(user: User) -> bool:
    return user.role in FARM_WIDE_ACCESS_ROLES


def get_accessible_farm_or_404(db: Session, farm_id: int, user: User) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if farm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.owner_id != user.id and not can_access_all_farms(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this farm.")
    return farm


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*allowed_roles: str):
    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not permitted to perform this action.",
            )
        return current_user
    return _checker
