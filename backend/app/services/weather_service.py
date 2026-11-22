"""
Weather Intelligence Module - Section 9 of the abstract.

If WEATHER_API_KEY is configured, production code would call a real
provider (e.g. OpenWeatherMap, Tomorrow.io, IMD). With no key set, this
module falls back to a deterministic seeded simulator: same
location+date always produces the same forecast, so the app is fully
demoable offline while still behaving like a real weather feed (temperature,
humidity, rainfall, rain probability, wind speed all vary realistically
day to day).
"""
import hashlib
import math
from datetime import date, timedelta
from typing import List

from app.schemas.weather import DailyForecast, WeatherResponse


def _seed_for(location: str, day: date) -> int:
    key = f"{location.lower().strip()}|{day.isoformat()}"
    return int(hashlib.sha256(key.encode()).hexdigest(), 16) % (2**32)


def _forecast_for_day(location: str, day: date, day_index: int) -> DailyForecast:
    seed = _seed_for(location, day)
    rnd = (seed % 1000) / 1000.0

    # Seasonal-ish base curve so values feel plausible rather than pure noise
    base_temp = 26 + 6 * math.sin(day.timetuple().tm_yday / 58.0)
    temperature_c = round(base_temp + (rnd - 0.5) * 8, 1)
    humidity_pct = round(45 + rnd * 45, 1)
    rain_probability_pct = round(((seed >> 8) % 1000) / 10.0, 1)
    rainfall_mm = round((rain_probability_pct / 100) * (((seed >> 16) % 25)), 1)
    wind_speed_kmh = round(5 + ((seed >> 4) % 250) / 10.0, 1)

    if rain_probability_pct > 65:
        condition = "Heavy rain likely"
    elif rain_probability_pct > 35:
        condition = "Scattered showers possible"
    elif temperature_c > 34:
        condition = "Hot and dry"
    elif humidity_pct > 80:
        condition = "Humid and overcast"
    else:
        condition = "Clear"

    return DailyForecast(
        date=day.isoformat(),
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        rainfall_mm=rainfall_mm,
        rain_probability_pct=rain_probability_pct,
        wind_speed_kmh=wind_speed_kmh,
        condition=condition,
    )


def get_weather(location: str, days: int = 5) -> WeatherResponse:
    today = date.today()
    forecast: List[DailyForecast] = [
        _forecast_for_day(location, today + timedelta(days=i), i) for i in range(days)
    ]
    current = forecast[0]

    advisories = []
    if current.rain_probability_pct > 60:
        advisories.append(
            "High rain probability in the next 24-48 hours - consider postponing "
            "scheduled irrigation and inspect field drainage."
        )
    if any(f.rain_probability_pct > 60 for f in forecast[1:3]):
        advisories.append(
            "Significant rainfall expected within 2-3 days - plan fertilizer "
            "application before or well after the rain event, not immediately before it."
        )
    if current.temperature_c > 35:
        advisories.append(
            "High temperature may stress flowering crops - consider light early-morning "
            "irrigation to cool the canopy and avoid fertilizer application during peak heat."
        )
    if current.humidity_pct > 80:
        advisories.append(
            "High humidity increases fungal disease risk (rust, blast) - scout fields "
            "closely over the next few days."
        )
    if not advisories:
        advisories.append("Conditions look stable - no weather-driven action needed today.")

    return WeatherResponse(location=location, current=current, forecast=forecast, advisories=advisories)
