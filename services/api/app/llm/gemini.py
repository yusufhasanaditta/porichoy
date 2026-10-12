"""Thin wrapper around google-genai for structured (JSON-schema) calls.

Every call: Pydantic schema → validated object, 60 s timeout, backoff on 429/503,
one retry with the validation error appended, and a log line with model + latency + tokens.
"""

import asyncio
import logging
import time
from pathlib import Path

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from app.config import settings

log = logging.getLogger("porichoy.llm")

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "agents" / "prompts"
TIMEOUT_MS = 60_000
MAX_BACKOFF_RETRIES = 3


class AIUnavailable(Exception):
    """Raised when no Gemini API key is configured."""


class AIFailed(Exception):
    """Raised when Gemini could not produce a valid answer."""


_client: genai.Client | None = None


def ai_enabled() -> bool:
    return settings.gemini_api_key is not None


def _get_client() -> genai.Client:
    global _client
    if settings.gemini_api_key is None:
        raise AIUnavailable("GEMINI_API_KEY is not set")
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key, http_options=types.HttpOptions(timeout=TIMEOUT_MS))
    return _client


def load_prompt(name: str, **values: str) -> str:
    """Load app/agents/prompts/<name>.md with the shared header, filling {{placeholders}}."""
    text = (PROMPTS_DIR / "_shared.md").read_text(encoding="utf-8") + "\n\n"
    text += (PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8")
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", value)
    return text


async def generate[T: BaseModel](
    *,
    model: str,
    system: str,
    contents: list[str],
    schema: type[T],
    temperature: float = 0.3,
) -> T:
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=temperature,
        response_mime_type="application/json",
        response_schema=schema,
    )
    parts: list[str] = list(contents)
    for attempt in range(2):
        raw = await _call_with_backoff(client, model, parts, config)
        try:
            return schema.model_validate_json(raw)
        except ValidationError as exc:
            log.warning("schema validation failed (attempt %d): %s", attempt + 1, exc.errors()[:3])
            parts = [*contents, f"Your previous reply did not match the schema. Errors: {exc.errors()[:5]}. Reply again with valid JSON only."]
    raise AIFailed("Gemini returned invalid JSON twice")


async def _call_with_backoff(
    client: genai.Client, model: str, parts: list[str], config: types.GenerateContentConfig
) -> str:
    delay = 2.0
    for attempt in range(MAX_BACKOFF_RETRIES + 1):
        start = time.perf_counter()
        try:
            content = types.Content(role="user", parts=[types.Part.from_text(text=p) for p in parts])
            resp = await client.aio.models.generate_content(model=model, contents=content, config=config)
        except errors.APIError as exc:
            retryable = exc.code in (429, 500, 503)
            if retryable and attempt < MAX_BACKOFF_RETRIES:
                log.warning("gemini %s returned %s, retrying in %.0fs", model, exc.code, delay)
                await asyncio.sleep(delay)
                delay *= 2
                continue
            raise AIFailed(f"Gemini error {exc.code}: {exc.message}") from exc
        usage = resp.usage_metadata
        log.info(
            "gemini model=%s latency_ms=%d in_tokens=%s out_tokens=%s",
            model,
            int((time.perf_counter() - start) * 1000),
            usage.prompt_token_count if usage else None,
            usage.candidates_token_count if usage else None,
        )
        if not resp.text:
            raise AIFailed("Gemini returned an empty response")
        return resp.text
    raise AIFailed("Gemini kept failing after retries")
