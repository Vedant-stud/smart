from typing import List, Optional
from pydantic import BaseModel


class DiseaseDetectionResult(BaseModel):
    predicted_condition: str
    confidence: float
    description: str
    suggested_next_steps: List[str]
    seek_professional_verification: bool = True
    note: str = (
        "This module runs a lightweight illustrative classifier bundled with "
        "the project. Wire in a trained CNN or vision-LLM endpoint in "
        "app/services/vision_service.py before using this for real crop-loss decisions."
    )
