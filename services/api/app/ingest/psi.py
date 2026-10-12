"""Google PageSpeed Insights v5 (Lighthouse lab data + Chrome UX field data)."""

from typing import Any

import httpx
from pydantic import BaseModel

from app.config import settings

PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


class PsiResult(BaseModel):
    strategy: str
    performance: float | None = None  # 0..1
    lcp_ms: float | None = None
    cls: float | None = None
    inp_ms: float | None = None  # field data only
    tbt_ms: float | None = None  # lab stand-in when INP field data is missing
    fcp_ms: float | None = None
    field_data: bool = False


def _audit(audits: dict[str, Any], key: str) -> float | None:
    value = audits.get(key, {}).get("numericValue")
    return float(value) if isinstance(value, (int, float)) else None


async def run_psi(url: str, strategy: str = "mobile") -> PsiResult:
    params: dict[str, str] = {"url": url, "strategy": strategy, "category": "performance"}
    if settings.psi_api_key:
        params["key"] = settings.psi_api_key
    async with httpx.AsyncClient(timeout=httpx.Timeout(90.0)) as client:
        resp = await client.get(PSI_URL, params=params)
    resp.raise_for_status()
    data = resp.json()
    lh = data.get("lighthouseResult", {})
    audits = lh.get("audits", {})
    perf = lh.get("categories", {}).get("performance", {}).get("score")
    result = PsiResult(
        strategy=strategy,
        performance=float(perf) if isinstance(perf, (int, float)) else None,
        lcp_ms=_audit(audits, "largest-contentful-paint"),
        cls=_audit(audits, "cumulative-layout-shift"),
        tbt_ms=_audit(audits, "total-blocking-time"),
        fcp_ms=_audit(audits, "first-contentful-paint"),
    )
    metrics = data.get("loadingExperience", {}).get("metrics", {})
    inp = metrics.get("INTERACTION_TO_NEXT_PAINT", {}).get("percentile")
    if isinstance(inp, (int, float)):
        result.inp_ms = float(inp)
        result.field_data = True
    return result
