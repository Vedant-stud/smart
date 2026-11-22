"""
Crop model - Section 7.3 Crop Management.
"""
from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship

from app.db.database import Base


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)

    crop_type = Column(String(80), nullable=False)       # e.g. Wheat, Cotton, Rice
    variety = Column(String(80), nullable=True)
    season = Column(String(30), nullable=True)            # Kharif | Rabi | Zaid
    sowing_date = Column(Date, nullable=True)
    expected_harvest_date = Column(Date, nullable=True)
    growth_stage = Column(String(40), default="Sown")     # Sown -> Germination -> Vegetative -> Flowering -> Maturity -> Harvested
    status = Column(String(30), default="active")         # active | harvested | failed
    area_acres = Column(Float, default=0)
    notes = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    farm = relationship("Farm", back_populates="crops")
