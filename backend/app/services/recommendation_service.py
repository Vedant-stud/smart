"""
AI Crop Recommendation + Irrigation/Fertilizer reasoning engine.
Implements Section 7.4 (AI Crop Recommendation), Section 10 (Smart
Irrigation), and Section 11 (Soil and Fertilizer Analysis).

This is a transparent rule-based reasoning engine: every recommendation
returns the specific factors that drove it (Section 7.4: "explain the
factors behind recommendations"). It is intentionally NOT a black-box
model, which also satisfies Section 23's requirement for a "clear
distinction between AI-generated recommendations and verified
agricultural guidance" - every output states its reasoning so a human
can evaluate it.

A trained ML yield/suitability model can be dropped in later by
replacing recommend_crops() internals while keeping the same return
shape, since the rest of the system only depends on the (title, body,
reasoning, confidence) contract.
"""
from typing import List, Dict, Optional

CROP_PROFILES = [
    {"crop": "Rice", "soil": ["clay", "loamy"], "water": "high", "season": ["Kharif"]},
    {"crop": "Wheat", "soil": ["loamy", "clay"], "water": "medium", "season": ["Rabi"]},
    {"crop": "Cotton", "soil": ["loamy", "sandy"], "water": "medium", "season": ["Kharif"]},
    {"crop": "Groundnut", "soil": ["sandy", "loamy"], "water": "low", "season": ["Kharif", "Zaid"]},
    {"crop": "Millet (Bajra)", "soil": ["sandy"], "water": "low", "season": ["Kharif"]},
    {"crop": "Chickpea (Gram)", "soil": ["loamy", "clay"], "water": "low", "season": ["Rabi"]},
    {"crop": "Sugarcane", "soil": ["loamy", "clay"], "water": "high", "season": ["Kharif", "Zaid"]},
    {"crop": "Mustard", "soil": ["loamy", "sandy"], "water": "low", "season": ["Rabi"]},
]


def recommend_crops(soil_type: str, irrigation_available: bool, season: Optional[str] = None) -> List[Dict]:
    soil_type = (soil_type or "loamy").lower()
    water_capacity = "high" if irrigation_available else "low"
    results = []
    for profile in CROP_PROFILES:
        if soil_type not in profile["soil"]:
            continue
        if season and season not in profile["season"]:
            continue
        water_ok = (
            profile["water"] == "low"
            or (profile["water"] == "medium" and water_capacity in ("high", "medium"))
            or (profile["water"] == "high" and water_capacity == "high")
        )
        reasoning_parts = [f"soil type '{soil_type}' matches {profile['crop']}'s preferred soil"]
        if season:
            reasoning_parts.append(f"fits the {season} season")
        if not water_ok:
            reasoning_parts.append(
                f"requires {profile['water']} water availability, but irrigation is limited on this farm"
            )
        confidence = "High" if water_ok and (not season or season in profile["season"]) else "Medium"
        results.append({
            "crop": profile["crop"],
            "suitable": water_ok,
            "confidence": confidence,
            "reasoning": "; ".join(reasoning_parts) + ".",
        })
    results.sort(key=lambda r: (not r["suitable"], r["confidence"] != "High"))
    return results


def analyze_soil(ph, nitrogen, phosphorus, potassium, organic_carbon, moisture) -> Dict[str, List[str]]:
    concerns: List[str] = []
    suggestions: List[str] = []

    if ph is not None:
        if ph < 5.5:
            concerns.append(f"Soil pH is low ({ph}) - risk of aluminum/manganese toxicity and reduced phosphorus availability.")
            suggestions.append("Consider agricultural lime application to raise pH toward the 6.0-7.5 optimal range.")
        elif ph > 8.0:
            concerns.append(f"Soil pH is high ({ph}) - iron, zinc, and manganese availability likely reduced.")
            suggestions.append("Consider gypsum or organic matter incorporation; monitor for micronutrient deficiency symptoms.")

    if nitrogen is not None and nitrogen < 240:
        concerns.append(f"Nitrogen level ({nitrogen} kg/ha) is below typical sufficiency for most staple crops.")
        suggestions.append("Plan a split nitrogen top-dressing at tillering/vegetative and flowering stages.")

    if phosphorus is not None and phosphorus < 11:
        concerns.append(f"Phosphorus level ({phosphorus} kg/ha) is low - may limit root establishment.")
        suggestions.append("Apply phosphorus at or before sowing since it moves slowly through soil.")

    if potassium is not None and potassium < 110:
        concerns.append(f"Potassium level ({potassium} kg/ha) is low - may reduce drought and disease resistance.")
        suggestions.append("Consider split potassium application, especially if soil is sandy (leaching risk).")

    if organic_carbon is not None and organic_carbon < 0.5:
        concerns.append(f"Organic carbon ({organic_carbon}%) is low - likely poor soil structure and water-holding capacity.")
        suggestions.append("Incorporate crop residue, compost, or green manure over the next few seasons to build organic matter.")

    if moisture is not None and moisture < 15:
        concerns.append(f"Soil moisture ({moisture}%) reading is low.")
        suggestions.append("Consider irrigation scheduling review; verify against recent rainfall and forecast.")

    if not concerns:
        concerns.append("No significant nutrient or pH concerns detected in the submitted values.")
        suggestions.append("Maintain current soil management practices and re-test each season.")

    return {"concerns": concerns, "suggestions": suggestions}


def irrigation_recommendation(rain_probability_pct: float, growth_stage: str, crop_type: str) -> Dict[str, str]:
    critical_stages = {"Flowering", "Grain-filling", "Vegetative"}
    if rain_probability_pct > 60:
        action = "postpone"
        reasoning = (
            f"Rain probability is {rain_probability_pct}% in the near term, which exceeds the "
            f"60% threshold for postponing irrigation to avoid waterlogging and nutrient runoff."
        )
    elif growth_stage in critical_stages:
        action = "irrigate"
        reasoning = (
            f"{crop_type} is at the {growth_stage} stage, a critical water-demand period, "
            f"and rain probability ({rain_probability_pct}%) is not high enough to rely on rainfall alone."
        )
    else:
        action = "monitor"
        reasoning = (
            f"{crop_type} is at the {growth_stage} stage (not a peak water-demand period) and "
            f"rain probability ({rain_probability_pct}%) is moderate - no immediate action needed."
        )
    return {"action": action, "reasoning": reasoning}
