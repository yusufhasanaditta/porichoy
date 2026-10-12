"""Website analysis pipeline: crawl ∥ PageSpeed → rule checks → AI content audit → scores."""

import asyncio
import logging
import time

import httpx

from app.agents.website import audit_content
from app.ingest.crawler import CrawlError, CrawlResult, crawl
from app.ingest.psi import PsiResult, run_psi
from app.llm.gemini import AIFailed, ai_enabled
from app.scoring.checks_web import onpage_checks, performance_checks, schema_checks, technical_checks
from app.scoring.core import RUBRIC_VERSION, Check, section_score, weighted_overall
from app.store.jobs import Job, StepTimer

log = logging.getLogger("porichoy.pipeline.website")

STEPS = ["crawl", "performance", "checks", "content", "score"]
SECTIONS = ["technical", "onpage", "schema", "performance", "content"]
SECTION_WEIGHTS = {"technical": 0.25, "onpage": 0.25, "schema": 0.1, "performance": 0.2, "content": 0.2}
CONTENT_IDS = [("who", 2), ("proof", 3), ("contact", 2), ("recent", 1)]


async def _timed_psi(job: Job, url: str) -> PsiResult | None:
    step = next(s for s in job.steps if s.key == "performance")
    step.status = "running"
    start = time.perf_counter()
    try:
        result = await run_psi(url)
        step.status = "done"
        return result
    except httpx.HTTPStatusError as exc:
        log.warning("PageSpeed failed for %s: %s", url, exc)
        step.status = "error"
        step.note = (
            "PageSpeed's shared free quota is used up. Add a free PSI_API_KEY to enable performance checks."
            if exc.response.status_code == 429
            else f"PageSpeed Insights returned an error ({exc.response.status_code}). Performance is left out of the score."
        )
        return None
    except Exception as exc:  # noqa: BLE001 - PageSpeed is optional; the report still works without it
        log.warning("PageSpeed failed for %s: %s", url, exc)
        step.status = "error"
        step.note = "PageSpeed Insights didn't respond in time. Performance is left out of the score."
        return None
    finally:
        step.ms = int((time.perf_counter() - start) * 1000)


async def run_website(job: Job, url: str) -> None:
    try:
        psi_task = asyncio.create_task(_timed_psi(job, url))
        with StepTimer(job, "crawl"):
            result: CrawlResult = await crawl(url)
        psi = await psi_task

        with StepTimer(job, "checks"):
            checks: list[Check] = [*technical_checks(result), *onpage_checks(result), *schema_checks(result), *performance_checks(psi)]

        external = sorted({link for p in result.pages for link in p.external_links})
        content: dict[str, object] = {}
        content_step = next(s for s in job.steps if s.key == "content")
        if not ai_enabled():
            content_step.status = "skipped"
            content_step.note = "Add GEMINI_API_KEY to enable the AI content review."
        else:
            try:
                with StepTimer(job, "content"):
                    content = await audit_content(result, job.lang, external)
            except AIFailed as exc:
                content_step.note = str(exc)
        ai_checks = content.get("checks")
        if isinstance(ai_checks, list):
            checks.extend(ai_checks)
        else:
            checks.extend(Check(id=i, section="content", weight=w, score=None, method="ai") for i, w in CONTENT_IDS)

        with StepTimer(job, "score"):
            sections = {s: section_score(checks, s) for s in SECTIONS}
            job.result = {
                "url": result.start_url,
                "finalUrl": result.final_url,
                "pages": [{"url": p.url, "title": p.title, "status": p.status} for p in result.pages],
                "overall": weighted_overall(sections, SECTION_WEIGHTS),
                "sections": sections,
                "checks": [c.model_dump() for c in checks],
                "psi": psi.model_dump() if psi else None,
                "aiAvailable": bool(content),
                "contentOverall": content.get("overall"),
                "findings": content.get("findings", []),
                "suggestions": content.get("suggestions"),
                "rubricVersion": RUBRIC_VERSION,
            }
        job.status = "done"
    except CrawlError as exc:
        job.status, job.error = "error", str(exc)
    except Exception:
        log.exception("website job %s failed", job.id)
        job.status, job.error = "error", "Something went wrong while checking this website. Please try again."
    finally:
        for step in job.steps:
            if step.status in ("pending", "running"):
                step.status = "skipped" if job.status == "error" else step.status
