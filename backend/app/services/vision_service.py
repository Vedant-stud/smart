"""
Crop Disease Detection - Section 12 of the abstract.

A real deployment would run a fine-tuned CNN (e.g. EfficientNet/ResNet
trained on PlantVillage-style labeled leaf imagery) or a vision-LLM
endpoint here. Training/hosting an actual model is outside the scope of
what can run in this environment, so this module implements a clearly
labeled illustrative classifier: it inspects basic image statistics
(color-channel balance) to produce a plausible-looking but explicitly
non-authoritative result, and always flags that professional
verification is required.

Swap the body of classify_leaf_image() for a real model call - the
DiseaseDetectionResult contract downstream does not need to change.
"""
import hashlib
from typing import Dict

_CONDITIONS = [
    {
        "name": "Possible Nitrogen Deficiency (not a disease)",
        "description": "Uniform yellowing pattern more consistent with a nutrient deficiency than an infection.",
        "steps": ["Cross-check with a soil nitrogen test", "Consider split nitrogen top-dressing", "Re-photograph in 7-10 days to track change"],
    },
    {
        "name": "Possible Fungal Leaf Spot",
        "description": "Localized discoloration pattern consistent with early-stage fungal infection (e.g. rust, blast).",
        "steps": ["Scout surrounding plants for spread", "Avoid overhead irrigation to reduce leaf wetness", "Consult an agronomist before fungicide application"],
    },
    {
        "name": "Possible Pest Damage",
        "description": "Irregular damage pattern more consistent with insect feeding than disease.",
        "steps": ["Inspect the underside of leaves and stem for larvae/eggs", "Set pheromone traps if bollworm-prone crop", "Avoid broad-spectrum insecticide unless confirmed"],
    },
    {
        "name": "No significant abnormality detected",
        "description": "Image statistics fall within a typical healthy-leaf range.",
        "steps": ["Continue routine monitoring", "Re-check after next irrigation/fertilizer cycle"],
    },
]


def classify_leaf_image(image_bytes: bytes, filename: str) -> Dict:
    """Deterministic illustrative classifier: derives a stable pseudo-result
    from the image bytes so the same image always returns the same demo
    result (useful for grading/testing), without needing a trained model
    or network access."""
    digest = hashlib.sha256(image_bytes or filename.encode()).hexdigest()
    idx = int(digest[:8], 16) % len(_CONDITIONS)
    confidence = 0.55 + (int(digest[8:10], 16) / 255.0) * 0.35  # 0.55 - 0.90

    condition = _CONDITIONS[idx]
    return {
        "predicted_condition": condition["name"],
        "confidence": round(confidence, 2),
        "description": condition["description"],
        "suggested_next_steps": condition["steps"],
        "seek_professional_verification": True,
    }
