"""
Task management, underpinning Section 15 Workflow Automation and
general farm-activity tracking.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(farm_id: int | None = None, is_completed: bool | None = None,
               db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Task)
    if farm_id:
        query = query.filter(Task.farm_id == farm_id)
    if is_completed is not None:
        query = query.filter(Task.is_completed == is_completed)
    # Sort incomplete-first, then by due date with NULLs last - written as a
    # boolean sort key rather than .nulls_last() so it behaves the same
    # across every SQL dialect/SQLite build, not just newer SQLite versions.
    return query.order_by(Task.is_completed.asc(), Task.due_date.is_(None), Task.due_date.asc()).all()


@router.post("", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    db.delete(task)
    db.commit()
    return None
