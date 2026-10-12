"""Porichoy API entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.errors import register_error_handlers
from app.llm.gemini import ai_enabled
from app.routers import cv, website

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

VERSION = "0.2.0"

app = FastAPI(title="Porichoy API", version=VERSION)
register_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(website.router)
app.include_router(cv.router)


@app.get("/healthz")
def healthz() -> dict[str, bool | str]:
    return {"ok": True, "version": VERSION, "ai": ai_enabled()}
