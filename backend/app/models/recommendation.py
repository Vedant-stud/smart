"""
Recommendation model - Section 7.4 AI Crop Recommendation and general
AI-generated decision-support records (irrigation, fertilizer, weather-driven).
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)

    category = Column(String(40), nullable=False)  # crop_selection | irrigation | fertilizer | weather | disease
    title = Column(String(150), nullable=False)
    body = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=True)         # explanation of factors behind the recommendation
    confidence = Column(String(10), nullable=True)  # e.g. "High" / "Medium" / "Low"
    source = Column(String(30), default="rule_engine")  # rule_engine | rag_chatbot | vision_model

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    farm = relationship("Farm", back_populates="recommendations")
