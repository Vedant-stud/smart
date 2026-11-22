"""
Chat message model - Section 7.5 AI Agricultural Chatbot.
Stores conversation history per user so the chatbot has continuity
and so RAG-retrieved sources can be audited (Section 23 AI Security:
"AI response logging").
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)

    role = Column(String(10), nullable=False)   # user | assistant
    content = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)        # JSON-encoded list of retrieved knowledge doc titles

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chat_messages")
