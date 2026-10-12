"""CV pipelines: analysis (read → rules → AI review → score) and improvement (write ⇄ verify)."""

import logging
from typing import Any

from app.agents.cv import audit_cv, improve_cv
from app.ingest.pdf import ParsedPdf, PdfError, parse_pdf
from app.llm.gemini import AIFailed, AIUnavailable, ai_enabled
from app.scoring.checks_cv import cv_checks
from app.scoring.core import RUBRIC_VERSION, Check, section_score, weighted_overall
from app.store.jobs import Job, StepTimer

log = logging.getLogger("porichoy.pipeline.cv")

STEPS = ["read", "rules", "review", "score"]
SECTIONS = ["format", "contact", "content"]
SECTION_WEIGHTS = {"format": 0.3, "contact": 0.2, "content": 0.5}


async def run_cv_analysis(job: Job, data: bytes, file_name: str, target_role: str) -> None:
    try:
        with StepTimer(job, "read"):
            pdf = parse_pdf(data)
        job.private["pdf"] = pdf
        job.private["target_role"] = target_role

        with StepTimer(job, "rules"):
            checks: list[Check] = cv_checks(pdf)

        review: dict[str, Any] = {}
        review_step = next(s for s in job.steps if s.key == "review")
        if not pdf.text_selectable:
            review_step.status = "skipped"
            review_step.note = "This PDF has no selectable text (it looks scanned), so it can't be reviewed."
        elif not ai_enabled():
            review_step.status = "skipped"
            review_step.note = "Add GEMINI_API_KEY to enable the AI review."
        else:
            try:
                with StepTimer(job, "review"):
                    review = await audit_cv(pdf, job.lang, target_role)
            except AIFailed as exc:
                review_step.note = str(exc)
        checks.extend(Check.model_validate(c) for c in review.get("aiChecks", []))

        with StepTimer(job, "score"):
            sections = {s: section_score(checks, s) for s in SECTIONS}
            job.result = {
                "fileName": file_name,
                "targetRole": target_role or None,
                "pages": pdf.pages,
                "lines": [ln.model_dump() for ln in pdf.lines],
                "overall": weighted_overall(sections, SECTION_WEIGHTS),
                "sections": sections,
                "checks": [c.model_dump() for c in checks],
                "aiAvailable": bool(review),
                "candidateName": review.get("candidateName"),
                "currentTitle": review.get("currentTitle"),
                "summary": review.get("overall"),
                "findings": review.get("findings", []),
                "questions": review.get("questions", []),
                "improve": None,
                "rubricVersion": RUBRIC_VERSION,
            }
        job.status = "done"
    except PdfError as exc:
        job.status, job.error = "error", str(exc)
    except Exception:
        log.exception("cv job %s failed", job.id)
        job.status, job.error = "error", "Something went wrong while reading this CV. Please try again."


async def run_cv_improve(job: Job, answers: list[dict[str, str]], target_role: str | None) -> None:
    state: dict[str, Any] = job.result["improve"]
    pdf: ParsedPdf = job.private["pdf"]
    role = target_role if target_role is not None else job.private.get("target_role", "")
    try:
        result = await improve_cv(pdf, job.lang, role, job.result.get("findings", []), answers)
        state.update(result)
        state["status"] = "done"
    except (AIFailed, AIUnavailable) as exc:
        state["status"], state["error"] = "error", str(exc)
    except Exception:
        log.exception("cv improve %s failed", job.id)
        state["status"], state["error"] = "error", "Something went wrong while writing your new CV. Please try again."
