from typing import List, Optional
from pydantic import BaseModel


class DailyForecast(BaseModel):
    date: str
    temperature_c: float
    humidity_pct: float
    rainfall_mm: float
    rain_probability_pct: float
    wind_speed_kmh: float
    condition: str


class WeatherResponse(BaseModel):
    location: str
    current: DailyForecast
    forecast: List[DailyForecast]
    advisories: List[str]
