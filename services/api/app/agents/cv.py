"""CV agents: auditor (findings + questions) and writer ⇄ verifier loop."""

import json
import logging
from typing import Any

from app.config import settings
from app.ingest.pdf import ParsedPdf
from app.llm.gemini import generate, load_prompt
from app.models.ai import CvAudit, CvVerdict, ImprovedCv
from app.scoring.core import Check, Evidence
from app.validate.evidence import normalize, quote_in_source

log = logging.getLogger("porichoy.agents.cv")

LANG_NAMES = {"en": "English", "bn": "Bangla (natural, everyday Bangla as spoken in Bangladesh)"}
MAX_WRITER_ROUNDS = 2
PASS_MIN_SCORE = 4


def _locate(quote: str, pdf: ParsedPdf, hint: int | None) -> int | None:
    """Return the line holding the quote, preferring the model's hint; None if the quote is not real."""
    if hint is not None and 1 <= hint <= len(pdf.lines) and quote_in_source(quote, pdf.lines[hint - 1].text):
        return hint
    for line in pdf.lines:
        if quote_in_source(quote, line.text):
            return line.n
    # Quotes can span two lines in a PDF; accept them if they appear in the joined text.
    if quote_in_source(quote, pdf.text):
        q = normalize(quote)[:20]
        return next((ln.n for ln in pdf.lines if q[:12] in normalize(ln.text)), hint)
    return None


async def audit_cv(pdf: ParsedPdf, lang: str, target_role: str) -> dict[str, Any]:
    system = load_prompt("cv_audit", lang_name=LANG_NAMES[lang], target_role=target_role or "(not given)")
    audit = await generate(model=settings.model_main, system=system, contents=[pdf.numbered()], schema=CvAudit)

    findings = []
    dropped = 0
    for f in audit.findings:
        line = _locate(f.quote, pdf, f.line)
        if line is None:
            dropped += 1
            continue
        findings.append(
            {
                "severity": f.severity,
                "section": f.section,
                "evidence": {"locator": f"cv:line:{line}", "quote": f.quote, "line": line},
                "problem": f.problem,
                "whyItHurts": f.why_it_hurts,
                "fixHint": f.fix_hint,
            }
        )
    if dropped:
        log.info("evidence checker dropped %d CV finding(s) with quotes not found in the CV", dropped)

    checks: list[Check] = []
    weights = {"summary_strong": 2, "action_verbs": 2, "achievements": 3, "spelling_grammar": 2}
    for c in audit.checks:
        evidence = None
        if c.quote:
            line = _locate(c.quote, pdf, c.line)
            if line is not None:
                evidence = Evidence(locator=f"cv:line:{line}", quote=c.quote)
        checks.append(
            Check(id=c.id, section="content", weight=weights[c.id], score=1.0 if c.passed else 0.0, method="ai", evidence=evidence, note=c.note)
        )

    return {
        "candidateName": audit.candidate_name,
        "currentTitle": audit.current_title,
        "overall": audit.overall,
        "aiChecks": [c.model_dump() for c in checks],
        "findings": findings,
        "droppedFindings": dropped,
        "questions": [q.model_dump() for q in audit.questions],
    }


def _verdict_passes(v: CvVerdict) -> bool:
    return not v.unsupported_claims and min(v.factual, v.ats_friendly, v.clarity) >= PASS_MIN_SCORE


async def improve_cv(
    pdf: ParsedPdf, lang: str, target_role: str, findings: list[dict[str, Any]], answers: list[dict[str, str]]
) -> dict[str, Any]:
    answers_text = "\n".join(f"Q: {a['question']}\nA: {a['answer']}" for a in answers if a.get("answer", "").strip()) or "(no answers)"
    findings_text = "\n".join(f"- [{f['severity']}] line {f['evidence']['line']}: {f['problem']}" for f in findings) or "(none)"
    system = load_prompt("cv_writer", lang_name=LANG_NAMES[lang], target_role=target_role or "(not given)")
    verifier_system = load_prompt("cv_verifier")

    attempts: list[dict[str, Any]] = []
    feedback = ""
    cv: ImprovedCv | None = None
    for round_no in range(1, MAX_WRITER_ROUNDS + 1):
        contents = [
            f"ORIGINAL CV:\n{pdf.numbered()}",
            f"USER ANSWERS:\n{answers_text}",
            f"AUDIT FINDINGS:\n{findings_text}",
        ]
        if feedback:
            contents.append(f"VERIFIER FEEDBACK (fix every point):\n{feedback}")
        cv = await generate(model=settings.model_main, system=system, contents=contents, schema=ImprovedCv, temperature=0.4)

        verdict = await generate(
            model=settings.model_verifier,
            system=verifier_system,
            contents=[
                f"ORIGINAL CV:\n{pdf.text}",
                f"USER ANSWERS:\n{answers_text}",
                f"NEW CV (JSON):\n{json.dumps(cv.model_dump(exclude={'changes'}), ensure_ascii=False)}",
            ],
            schema=CvVerdict,
            temperature=0.0,
        )
        passed = _verdict_passes(verdict)
        attempts.append({"round": round_no, "pass": passed, **verdict.model_dump()})
        if passed:
            break
        feedback = verdict.feedback + "\nUnsupported claims to remove: " + "; ".join(u.text for u in verdict.unsupported_claims)

    assert cv is not None
    return {
        "cv": cv.model_dump(),
        "attempts": attempts,
        "verified": attempts[-1]["pass"],
        "models": {"writer": settings.model_main, "verifier": settings.model_verifier},
    }
