"""
Task model - powers Section 15 Workflow Automation
(auto-created reminders / activity tasks) and manual task management.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)

    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(40), default="general")  # irrigation | fertilizer | pest | harvest | general
    due_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    auto_generated = Column(Boolean, default=False)  # True if created by workflow automation

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    farm = relationship("Farm", back_populates="tasks")
