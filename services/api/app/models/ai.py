"""Structured-output schemas for every Gemini call (the model must reply in exactly these shapes)."""

from typing import Literal

from pydantic import BaseModel, Field

Severity = Literal["critical", "major", "minor"]


# ---------- CV audit ----------

class CvAiCheck(BaseModel):
    id: Literal["summary_strong", "action_verbs", "achievements", "spelling_grammar"]
    passed: bool
    line: int | None = Field(description="Line number of the most relevant line, or null")
    quote: str | None = Field(description="Exact words copied from that line, or null")
    note: str = Field(description="One sentence explaining the verdict")


class CvFinding(BaseModel):
    severity: Severity
    section: str = Field(description="CV section, e.g. Summary, Experience, Skills")
    line: int = Field(description="Line number the quote comes from")
    quote: str = Field(description="Exact words copied from the CV line, max 200 characters")
    problem: str
    why_it_hurts: str
    fix_hint: str


class CvQuestion(BaseModel):
    id: str = Field(description="Short id like q1, q2")
    question: str
    why: str = Field(description="Why the answer will improve the CV, one sentence")
    related_line: int | None = None
    example_answer: str | None = Field(description="A short example of a good answer, clearly hypothetical")


class CvAudit(BaseModel):
    candidate_name: str | None
    current_title: str | None
    overall: str = Field(description="2-3 sentence honest assessment")
    checks: list[CvAiCheck]
    findings: list[CvFinding]
    questions: list[CvQuestion]


# ---------- Improved CV ----------

class Contact(BaseModel):
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    website: str | None = None


class Experience(BaseModel):
    title: str
    company: str
    location: str | None = None
    start: str | None = None
    end: str | None = None
    bullets: list[str]


class Education(BaseModel):
    degree: str
    school: str
    start: str | None = None
    end: str | None = None
    details: str | None = None


class Project(BaseModel):
    name: str
    bullets: list[str]


class SkillGroup(BaseModel):
    category: str
    items: list[str]


class Change(BaseModel):
    what: str
    why: str


class ImprovedCv(BaseModel):
    name: str
    headline: str
    contact: Contact
    summary: str
    experience: list[Experience]
    projects: list[Project]
    education: list[Education]
    skills: list[SkillGroup]
    certifications: list[str]
    languages: list[str]
    changes: list[Change] = Field(description="The most important improvements you made and why")


class Unsupported(BaseModel):
    text: str = Field(description="The exact claim from the new CV")
    reason: str


class CvVerdict(BaseModel):
    factual: int = Field(description="1-5: every claim is supported by the original CV or the user's answers")
    ats_friendly: int = Field(description="1-5")
    clarity: int = Field(description="1-5")
    unsupported_claims: list[Unsupported]
    feedback: str = Field(description="Numbered, specific instructions for the writer; empty if perfect")


# ---------- Website content ----------

class WebAiCheck(BaseModel):
    id: Literal["who", "proof", "contact", "recent"]
    passed: bool
    page_url: str | None
    quote: str | None = Field(description="Exact words copied from that page, or null")
    note: str


class WebFinding(BaseModel):
    severity: Severity
    page_url: str
    quote: str = Field(description="Exact words copied from the page text, max 200 characters")
    problem: str
    why_it_hurts: str
    fix_hint: str


class WebSuggestions(BaseModel):
    title: str = Field(description="New homepage title, 30-60 characters")
    meta_description: str = Field(description="New meta description, 70-160 characters")
    h1: str
    entity_type: Literal["Person", "Organization", "LocalBusiness"]
    entity_name: str
    entity_job_title: str | None
    entity_description: str


class WebContentAudit(BaseModel):
    overall: str = Field(description="2-3 sentence honest assessment")
    checks: list[WebAiCheck]
    findings: list[WebFinding]
    suggestions: WebSuggestions
