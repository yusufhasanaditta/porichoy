import io

from docx import Document
from fastapi.testclient import TestClient

from app.export.docx import build_docx
from app.ingest.pdf import parse_pdf
from app.main import app
from app.scoring.checks_cv import cv_checks
from app.scoring.core import section_score
from tests.conftest import make_pdf

client = TestClient(app)


def _by_id(checks: list) -> dict:  # type: ignore[type-arg]
    return {c.id: c for c in checks}


def test_parse_pdf_numbers_lines(sample_cv_pdf: bytes) -> None:
    pdf = parse_pdf(sample_cv_pdf)
    assert pdf.pages == 1
    assert pdf.text_selectable
    assert pdf.lines[0].n == 1 and pdf.lines[0].text == "Rahim Uddin"


def test_cv_rules_catch_common_problems(sample_cv_pdf: bytes) -> None:
    checks = _by_id(cv_checks(parse_pdf(sample_cv_pdf)))
    assert checks["contact_email"].score == 1.0
    assert checks["contact_phone"].score == 1.0
    assert checks["contact_linkedin"].score == 0.0
    assert checks["personal_info"].score == 0.0
    assert checks["personal_info"].evidence is not None
    assert "Date of Birth" in checks["personal_info"].evidence.quote
    assert checks["date_consistency"].score == 0.0  # "Jan 2021" mixed with "03/2023"
    assert checks["bullets_quantified"].score == 0.5  # 1 of 4 bullets has a number
    assert checks["standard_headings"].score == 1.0


def test_scanned_pdf_fails_text_check() -> None:
    pdf = parse_pdf(make_pdf(["Hi"]))
    checks = _by_id(cv_checks(pdf))
    assert checks["text_selectable"].score == 0.0
    assert "contact_email" not in checks
    assert section_score(list(checks.values()), "format") is not None


def test_analyze_rejects_non_pdf() -> None:
    res = client.post("/v1/cv/analyze", files={"file": ("cv.txt", b"hello", "text/plain")})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "not_pdf"


def test_analyze_runs_rules_without_ai(sample_cv_pdf: bytes) -> None:
    res = client.post("/v1/cv/analyze", files={"file": ("my cv.pdf", sample_cv_pdf, "application/pdf")}, data={"lang": "bn"})
    assert res.status_code == 202
    job_id = res.json()["id"]
    body = client.get(f"/v1/cv/{job_id}").json()
    assert body["status"] == "done"
    assert body["lang"] == "bn"
    assert body["result"]["aiAvailable"] is False
    assert body["result"]["overall"] is not None
    assert "private" not in body
    review = next(s for s in body["steps"] if s["key"] == "review")
    assert review["status"] == "skipped"
    # Improve needs AI, which is disabled in tests
    res = client.post(f"/v1/cv/{job_id}/improve", json={"answers": []})
    assert res.status_code == 503
    # User can delete their data
    assert client.delete(f"/v1/cv/{job_id}").json() == {"deleted": True}
    assert client.get(f"/v1/cv/{job_id}").status_code == 404


def test_docx_export_contains_sections() -> None:
    cv = {
        "name": "Rahim Uddin",
        "headline": "Frontend Developer · React",
        "contact": {"email": "rahim@example.com", "phone": None, "location": "Dhaka", "linkedin": None, "website": None},
        "summary": "Frontend developer.",
        "experience": [{"title": "Web Designer", "company": "Pixel Studio", "location": None, "start": "Jan 2021", "end": "Mar 2023", "bullets": ["Built 14 sites."]}],
        "projects": [],
        "education": [{"degree": "BSc CSE", "school": "DIU", "start": None, "end": "2020", "details": None}],
        "skills": [{"category": "Frontend", "items": ["React", "CSS"]}],
        "certifications": [],
        "languages": ["Bangla", "English"],
    }
    doc = Document(io.BytesIO(build_docx(cv)))
    text = "\n".join(p.text for p in doc.paragraphs)
    for expected in ("Rahim Uddin", "EXPERIENCE", "Built 14 sites.", "Frontend: React, CSS", "LANGUAGES"):
        assert expected in text
