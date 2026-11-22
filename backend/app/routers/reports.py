"""
Reporting Module - Section 16.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.task import Task
from app.models.report import Report
from app.services.report_service import generate_farm_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/farm/{farm_id}/generate")
def generate_report(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")

    crops = db.query(Crop).filter(Crop.farm_id == farm_id).all()
    tasks = db.query(Task).filter(Task.farm_id == farm_id, Task.is_completed == False).all()  # noqa: E712

    summary = {
        "location": farm.location_text,
        "area_acres": farm.area_acres,
        "soil_type": farm.soil_type or "Not specified",
        "irrigation_available": farm.irrigation_available,
        "active_crops": len([c for c in crops if c.status == "active"]),
        "open_tasks": len(tasks),
    }
    crop_dicts = [{"crop_type": c.crop_type, "variety": c.variety, "growth_stage": c.growth_stage,
                   "status": c.status, "area_acres": c.area_acres} for c in crops]
    task_dicts = [{"title": t.title, "category": t.category, "due_date": t.due_date,
                   "is_completed": t.is_completed} for t in tasks]

    filepath = generate_farm_report(farm.name, summary, crop_dicts, task_dicts)

    report = Report(farm_id=farm.id, generated_by=user.id, report_type="farm_summary", format="pdf", file_path=filepath)
    db.add(report)
    db.commit()
    db.refresh(report)

    return {"report_id": report.id, "download_url": f"/api/reports/{report.id}/download"}


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return FileResponse(report.file_path, media_type="application/pdf", filename=f"report_{report_id}.pdf")


@router.get("/farm/{farm_id}")
def list_reports(farm_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    reports = db.query(Report).filter(Report.farm_id == farm_id).order_by(Report.created_at.desc()).all()
    return [{"id": r.id, "report_type": r.report_type, "format": r.format, "created_at": r.created_at} for r in reports]
