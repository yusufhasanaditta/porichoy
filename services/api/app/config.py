"""Settings read from the environment (and services/api/.env for local development)."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str | None
    psi_api_key: str | None
    model_main: str
    model_verifier: str
    model_lite: str
    allowed_origins: list[str]


def _env(name: str, default: str) -> str:
    value = os.getenv(name, "").strip()
    return value or default


def load_settings() -> Settings:
    origins = _env("ALLOWED_ORIGINS", "http://localhost:3000")
    return Settings(
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip() or None,
        psi_api_key=os.getenv("PSI_API_KEY", "").strip() or None,
        model_main=_env("MODEL_MAIN", "gemini-3.8-flash"),
        model_verifier=_env("MODEL_VERIFIER", "gemini-3.5-flash-lite"),
        model_lite=_env("MODEL_LITE", "gemini-3.5-flash-lite"),
        allowed_origins=[o.strip() for o in origins.split(",") if o.strip()],
    )


settings = load_settings()
