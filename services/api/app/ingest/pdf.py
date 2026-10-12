"""Read a CV PDF into numbered lines (the locators used as evidence: cv:line:N)."""

import io

from pydantic import BaseModel
from pypdf import PdfReader
from pypdf.errors import PdfReadError

MAX_PAGES = 6
MIN_TEXT_CHARS = 200


class Line(BaseModel):
    n: int
    page: int
    text: str


class ParsedPdf(BaseModel):
    pages: int
    lines: list[Line]
    text_selectable: bool

    @property
    def text(self) -> str:
        return "\n".join(line.text for line in self.lines)

    def numbered(self) -> str:
        return "\n".join(f"{line.n}: {line.text}" for line in self.lines)


class PdfError(Exception):
    pass


def parse_pdf(data: bytes) -> ParsedPdf:
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise PdfError("This PDF is password-protected. Please upload an unlocked copy.")
        lines: list[Line] = []
        for page_no, page in enumerate(reader.pages[:MAX_PAGES], start=1):
            for raw in (page.extract_text() or "").splitlines():
                text = " ".join(raw.split())
                if text:
                    lines.append(Line(n=len(lines) + 1, page=page_no, text=text))
        total_chars = sum(len(line.text) for line in lines)
        return ParsedPdf(pages=len(reader.pages), lines=lines, text_selectable=total_chars >= MIN_TEXT_CHARS)
    except PdfReadError as exc:
        raise PdfError("We couldn't read this PDF. Try exporting it again from Word or Google Docs.") from exc
