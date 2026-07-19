"""
Application Configuration Module.

Uses pydantic-settings to load, parse, and validate environment variables
from backend/.env. Fails fast at startup with descriptive error messages if
required variables are missing or invalid.
"""

from functools import lru_cache
import os
from pathlib import Path
from typing import List, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Path to backend directory containing .env
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    """
    Application settings validated via Pydantic V2.

    All settings are loaded from environment variables or the .env file.
    Default fallback values are provided for optional configuration.
    """

    # --- Project Metadata ---
    APP_NAME: str = "HR Assistant API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # --- LLM Integration (Oxlo.ai / OpenAI-compatible API) ---
    OXLO_API_KEY: str = Field(
        ...,
        description="API key for Oxlo.ai LLM service. Required for RAG generation.",
    )
    LLM_BASE_URL: str = Field(
        default="https://api.oxlo.ai/v1",
        description="Base URL for Oxlo.ai OpenAI-compatible endpoint.",
    )
    LLM_MODEL: str = Field(
        default="deepseek-v3.2",
        description="Model ID to use for chat responses.",
    )
    LLM_MAX_TOKENS: int = Field(
        default=1024,
        ge=64,
        le=4096,
        description="Maximum tokens per LLM completion.",
    )
    LLM_TEMPERATURE: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Sampling temperature for LLM.",
    )

    # --- JWT Security ---
    SECRET_KEY: str = Field(
        ...,
        min_length=16,
        description="Secret key for JWT token signing. Must be at least 16 chars.",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=1440,  # 24 hours
        ge=15,
        description="JWT access token expiration time in minutes.",
    )
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(
        default=10080,  # 7 days
        ge=60,
        description="JWT refresh token expiration time in minutes.",
    )

    # --- Database ---
    DATABASE_URL: str = Field(
        default="sqlite:///./hr_assistant.db",
        description="Database connection URL (SQLAlchemy format).",
    )

    # --- CORS ---
    CORS_ORIGINS: Union[str, List[str]] = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Comma-separated list of allowed CORS origins.",
    )

    # --- Retrieval & Logging ---
    RETRIEVER_TYPE: str = Field(
        default="keyword",
        description="Retrieval engine type: 'keyword' or 'vector'.",
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Logging level: DEBUG, INFO, WARNING, ERROR.",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Convert comma-separated string to list of origins."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("OXLO_API_KEY")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        """Ensure API key is not an empty string or default placeholder."""
        if not v or v.strip() == "" or v == "your_oxlo_api_key_here":
            raise ValueError(
                "\n❌ CONFIGURATION ERROR: OXLO_API_KEY is missing or set to placeholder.\n"
                "Please set a valid OXLO_API_KEY in backend/.env"
            )
        return v.strip()

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings factory.
    Reads .env once on startup and caches the Settings instance.
    """
    try:
        return Settings()
    except Exception as err:
        print(f"\n❌ FAILED TO LOAD SETTINGS: {err}\n")
        raise
