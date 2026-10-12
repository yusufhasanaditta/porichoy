"""Rule-based CV checks (format, contact, content)."""

import re

from app.ingest.pdf import Line, ParsedPdf
from app.scoring.core import Check, Evidence

HEADINGS = (
    "experience", "work experience", "employment", "education", "skills", "summary", "profile",
    "projects", "certifications", "achievements", "objective", "training", "languages",
)
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE = re.compile(r"(\+?\d[\d\s().-]{8,}\d)")
LINKEDIN = re.compile(r"linkedin\.com/in/[\w-]+", re.IGNORECASE)
BULLET = re.compile(r"^[•●▪◦‣∙·\-*–]\s*")
PERSONAL = re.compile(
    r"\b(date of birth|d\.?o\.?b\.?|marital status|religion|father'?s name|mother'?s name|blood group|nationality|gender|age\s*:)",
    re.IGNORECASE,
)
DATE_STYLES = {
    "month-name": re.compile(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b", re.IGNORECASE),
    "mm/yyyy": re.compile(r"\b(0?[1-9]|1[0-2])[/.-](19|20)\d{2}\b"),
    "yyyy-mm": re.compile(r"\b(19|20)\d{2}[/.-](0?[1-9]|1[0-2])\b"),
}


def _ev(line: Line) -> Evidence:
    return Evidence(locator=f"cv:line:{line.n}", quote=line.text[:200])


def _first(lines: list[Line], pattern: re.Pattern[str]) -> Line | None:
    return next((ln for ln in lines if pattern.search(ln.text)), None)


def cv_checks(pdf: ParsedPdf) -> list[Check]:
    lines = pdf.lines
    words = sum(len(ln.text.split()) for ln in lines)
    checks: list[Check] = [
        Check(id="text_selectable", section="format", weight=3, score=1.0 if pdf.text_selectable else 0.0),
        Check(id="page_count", section="format", weight=1, score=1.0 if 1 <= pdf.pages <= 2 else 0.0, value=f"{pdf.pages} page(s)"),
        Check(id="length_words", section="format", weight=1, score=1.0 if 250 <= words <= 1200 else 0.0, value=f"{words} words"),
    ]
    if not pdf.text_selectable:
        return checks

    found_headings = {h for ln in lines if len(ln.text) <= 40 for h in HEADINGS if ln.text.strip(" :").lower() == h}
    checks.append(
        Check(
            id="standard_headings",
            section="format",
            weight=2,
            score=1.0 if len(found_headings) >= 3 else 0.0,
            value=", ".join(sorted(found_headings)) or "none found",
        )
    )

    for check_id, pattern, weight in (("contact_email", EMAIL, 2), ("contact_phone", PHONE, 1), ("contact_linkedin", LINKEDIN, 1)):
        hit = _first(lines, pattern)
        checks.append(Check(id=check_id, section="contact", weight=weight, score=1.0 if hit else 0.0, evidence=_ev(hit) if hit else None))

    bullets = [ln for ln in lines if BULLET.match(ln.text)]
    quantified = [ln for ln in bullets if re.search(r"\d", ln.text)]
    if bullets:
        ratio = len(quantified) / len(bullets)
        weakest = next((ln for ln in bullets if not re.search(r"\d", ln.text)), None)
        checks.append(
            Check(
                id="bullets_quantified",
                section="content",
                weight=3,
                score=1.0 if ratio >= 0.4 else 0.5 if ratio >= 0.2 else 0.0,
                evidence=_ev(weakest) if weakest and ratio < 0.4 else None,
                value=f"{len(quantified)} of {len(bullets)} bullet points include a number",
            )
        )
    else:
        checks.append(Check(id="bullets_quantified", section="content", weight=3, score=0.0, value="no bullet points found"))

    styles = {name for name, pat in DATE_STYLES.items() if any(pat.search(ln.text) for ln in lines)}
    checks.append(
        Check(
            id="date_consistency",
            section="content",
            weight=1,
            score=1.0 if len(styles) <= 1 else 0.0,
            value=", ".join(sorted(styles)) or "no dates found",
        )
    )

    personal = _first(lines, PERSONAL)
    checks.append(
        Check(id="personal_info", section="content", weight=1, score=0.0 if personal else 1.0, evidence=_ev(personal) if personal else None)
    )
    return checks
