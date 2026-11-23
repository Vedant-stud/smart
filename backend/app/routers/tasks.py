"""
Task management, underpinning Section 15 Workflow Automation and
general farm-activity tracking.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import can_access_all_farms, get_accessible_farm_or_404, get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(farm_id: int | None = None, is_completed: bool | None = None,
               db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Task).join(Farm)
    if farm_id is not None:
        get_accessible_farm_or_404(db, farm_id, user)
        query = query.filter(Task.farm_id == farm_id)
    elif not can_access_all_farms(user):
        query = query.filter(Farm.owner_id == user.id)
    if is_completed is not None:
        query = query.filter(Task.is_completed == is_completed)
    # Sort incomplete-first, then by due date with NULLs last - written as a
    # boolean sort key rather than .nulls_last() so it behaves the same
    # across every SQL dialect/SQLite build, not just newer SQLite versions.
    return query.order_by(Task.is_completed.asc(), Task.due_date.is_(None), Task.due_date.asc()).all()


@router.post("", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_accessible_farm_or_404(db, payload.farm_id, user)
    if payload.crop_id is not None and not db.query(Crop).filter(
        Crop.id == payload.crop_id,
        Crop.farm_id == payload.farm_id,
    ).first():
        raise HTTPException(status_code=404, detail="Crop not found for this farm.")
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    get_accessible_farm_or_404(db, task.farm_id, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "farm_id":
            get_accessible_farm_or_404(db, value, user)
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    get_accessible_farm_or_404(db, task.farm_id, user)
    db.delete(task)
    db.commit()
    return None
