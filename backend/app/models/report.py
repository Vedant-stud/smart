"""
Report model - Section 16 Reporting Module metadata (generated files
are written to disk / object storage; this row indexes them for search
and history).
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.db.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    report_type = Column(String(40), nullable=False)  # farm_summary | crop_performance | weather_history
    format = Column(String(10), default="pdf")          # pdf | xlsx
    file_path = Column(String(300), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
