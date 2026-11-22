from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    farm_id: Optional[int] = None


class ChatSource(BaseModel):
    title: str
    snippet: str
    score: float


class ChatResponse(BaseModel):
    reply: str
    sources: List[ChatSource] = []
    created_at: datetime
