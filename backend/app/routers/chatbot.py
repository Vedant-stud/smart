"""
AI Agricultural Chatbot - Section 7.5, powered by the RAG engine (Section 8).
"""
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.farm import Farm
from app.schemas.chat import ChatRequest, ChatResponse, ChatSource
from app.services.rag_service import get_rag_engine

router = APIRouter(prefix="/api/chatbot", tags=["AI Chatbot"])


@router.post("/ask", response_model=ChatResponse)
def ask(payload: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    engine = get_rag_engine()
    retrieved = engine.retrieve(payload.message)

    farm_context = ""
    if payload.farm_id:
        farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
        if farm:
            farm_context = (
                f"For your farm '{farm.name}' ({farm.soil_type or 'unspecified'} soil, "
                f"{'irrigation available' if farm.irrigation_available else 'no irrigation available'}):"
            )

    reply = engine.generate(payload.message, retrieved, farm_context=farm_context)

    db.add(ChatMessage(user_id=user.id, farm_id=payload.farm_id, role="user", content=payload.message))
    db.add(ChatMessage(
        user_id=user.id, farm_id=payload.farm_id, role="assistant", content=reply,
        sources=json.dumps([d["title"] for d in retrieved]),
    ))
    db.commit()

    return ChatResponse(
        reply=reply,
        sources=[ChatSource(title=d["title"], snippet=d["content"][:140] + "...", score=d["score"]) for d in retrieved],
        created_at=datetime.now(timezone.utc),
    )


@router.get("/history")
def get_history(farm_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == user.id)
    if farm_id:
        query = query.filter(ChatMessage.farm_id == farm_id)
    messages = query.order_by(ChatMessage.created_at.asc()).all()
    return [
        {
            "id": m.id, "role": m.role, "content": m.content,
            "sources": json.loads(m.sources) if m.sources else [],
            "created_at": m.created_at,
        }
        for m in messages
    ]
