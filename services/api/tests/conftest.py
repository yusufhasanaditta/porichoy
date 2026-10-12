import io

import pytest
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

SAMPLE_CV_LINES = [
    "Rahim Uddin",
    "Web Designer",
    "Email: rahim.uddin@example.com | Phone: +880 1712 345678 | Dhaka, Bangladesh",
    "Career Objective",
    "To work in a challenging position in a reputed organization where I can use my skills.",
    "Experience",
    "Web Designer, Pixel Studio, Dhaka",
    "Jan 2021 - 03/2023",
    "• Responsible for making websites for clients.",
    "• Worked with the team on different projects.",
    "• Built 14 client websites in React and WordPress.",
    "Freelance Web Developer",
    "04/2023 - Present",
    "• Doing freelance work on Fiverr and Upwork.",
    "Education",
    "BSc in Computer Science and Engineering, Daffodil International University, 2020",
    "Skills",
    "HTML, CSS, JavaScript, React, WordPress, Figma",
    "Personal Information",
    "Date of Birth: 12 March 1998",
    "Religion: Islam",
    "Marital Status: Single",
]


def make_pdf(lines: list[str]) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    y = 800
    for line in lines:
        c.drawString(50, y, line.replace("•", "-"))
        y -= 18
    c.save()
    return buf.getvalue()


@pytest.fixture
def sample_cv_pdf() -> bytes:
    return make_pdf(SAMPLE_CV_LINES)


@pytest.fixture(autouse=True)
def no_ai(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests never call Gemini, even if a real key is in .env."""
    monkeypatch.setattr("app.pipelines.cv.ai_enabled", lambda: False)
    monkeypatch.setattr("app.pipelines.website.ai_enabled", lambda: False)
    monkeypatch.setattr("app.routers.cv.ai_enabled", lambda: False)
