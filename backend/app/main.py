"""
Smart Crop Advisor API entrypoint.

Wires together all 12 functional modules from the project abstract:
auth, farms, crops, tasks, chatbot (RAG), weather, alerts, analytics,
disease detection, recommendations, reports, and soil analysis.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine

# Importing app.models registers every model class on Base's metadata
# before create_all() runs - without this import, tables for models that
# aren't otherwise imported yet would silently not be created.
import app.models  # noqa: F401

from app.routers import (
    alerts,
    analytics,
    auth,
    chatbot,
    crops,
    disease,
    farms,
    recommendations,
    reports,
    soil,
    tasks,
    weather,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered agricultural decision-support platform.",
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(crops.router)
app.include_router(tasks.router)
app.include_router(chatbot.router)
app.include_router(weather.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(disease.router)
app.include_router(recommendations.router)
app.include_router(reports.router)
app.include_router(soil.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "env": settings.ENV}
