"""
Application configuration.

Settings are loaded from environment variables (see .env.example).
Using pydantic-settings means every config value is validated and typed,
and the same code works identically in local dev, CI, and cloud deployment -
one of the cloud-native characteristics described in the project abstract.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Smart Crop Advisor"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"

    SECRET_KEY: str = "dev-only-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./smart_crop_advisor.db"

    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    WEATHER_API_KEY: str = ""

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
