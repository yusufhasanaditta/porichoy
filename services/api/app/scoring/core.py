"""Shared scoring types. Scores are computed here from check results, never by an LLM."""

from typing import Literal

from pydantic import BaseModel

RUBRIC_VERSION = "1.0"


class Evidence(BaseModel):
    locator: str
    quote: str


class Check(BaseModel):
    id: str
    section: str
    weight: int
    # 1.0 = pass, 0.0 = fail, 0.5 = partial, None = could not be measured (excluded from the score)
    score: float | None
    method: Literal["rule", "ai"] = "rule"
    evidence: Evidence | None = None
    # Measured value shown to the user, e.g. "4 characters" or "2.9 s"
    value: str | None = None
    # AI checks carry their own explanation; rule checks are explained by the UI's message files
    note: str | None = None


def section_score(checks: list[Check], section: str) -> int | None:
    scored = [c for c in checks if c.section == section and c.score is not None]
    total = sum(c.weight for c in scored)
    if total == 0:
        return None
    return round(100 * sum(c.weight * (c.score or 0.0) for c in scored) / total)


def weighted_overall(section_scores: dict[str, int | None], weights: dict[str, float]) -> int | None:
    """Re-balances weights when a section could not be measured."""
    present = {k: v for k, v in section_scores.items() if v is not None and k in weights}
    total = sum(weights[k] for k in present)
    if total == 0:
        return None
    return round(sum(weights[k] * v for k, v in present.items()) / total)
