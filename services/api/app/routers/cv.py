import re
from typing import Annotated, Any, Literal

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.errors import ApiError
from app.export.docx import build_docx
from app.llm.gemini import ai_enabled
from app.pipelines.cv import STEPS, run_cv_analysis, run_cv_improve
from app.store.jobs import Job, create_job, delete_job, get_job

router = APIRouter(prefix="/v1/cv", tags=["cv"])

MAX_BYTES = 5 * 1024 * 1024


def _job(job_id: str) -> Job:
    job = get_job(job_id, "cv")
    if job is None:
        raise ApiError(404, "not_found", "This CV report doesn't exist or has expired. Please upload your CV again.")
    return job


@router.post("/analyze", status_code=202)
async def analyze(
    tasks: BackgroundTasks,
    file: Annotated[UploadFile, File()],
    lang: Annotated[Literal["en", "bn"], Form()] = "en",
    target_role: Annotated[str, Form(max_length=120)] = "",
) -> dict[str, str]:
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ApiError(413, "too_large", "This file is over 5 MB. Please upload a smaller PDF.")
    if not data.startswith(b"%PDF"):
        raise ApiError(422, "not_pdf", "Please upload a PDF file.")
    job = create_job("cv", STEPS, lang)
    name = re.sub(r"[^\w.\- ]", "", file.filename or "cv.pdf")[:120]
    tasks.add_task(run_cv_analysis, job, data, name, target_role.strip())
    return {"id": job.id, "status": job.status}


@router.get("/{job_id}")
async def get_report(job_id: str) -> dict[str, Any]:
    return _job(job_id).model_dump()


class Answer(BaseModel):
    questionId: str = Field(max_length=20)
    question: str = Field(max_length=500)
    answer: str = Field(max_length=1500)


class ImproveRequest(BaseModel):
    answers: list[Answer] = Field(default_factory=list, max_length=12)
    targetRole: str | None = Field(default=None, max_length=120)


@router.post("/{job_id}/improve", status_code=202)
async def improve(job_id: str, body: ImproveRequest, tasks: BackgroundTasks) -> dict[str, str]:
    job = _job(job_id)
    if job.status != "done":
        raise ApiError(409, "not_ready", "The CV analysis hasn't finished yet.")
    if not ai_enabled():
        raise ApiError(503, "ai_unavailable", "The AI writer isn't set up yet (missing GEMINI_API_KEY).")
    if "pdf" not in job.private or not job.private["pdf"].text_selectable:
        raise ApiError(422, "no_text", "This CV has no selectable text, so it can't be rewritten.")
    current = job.result.get("improve")
    if current and current.get("status") == "running":
        raise ApiError(409, "already_running", "Your new CV is already being written.", retryable=True)
    answers = [a.model_dump() for a in body.answers]
    job.result["improve"] = {"status": "running", "answers": answers}
    tasks.add_task(run_cv_improve, job, answers, body.targetRole)
    return {"status": "running"}


@router.get("/{job_id}/improved.docx")
async def improved_docx(job_id: str) -> Response:
    improve = _job(job_id).result.get("improve") or {}
    if improve.get("status") != "done":
        raise ApiError(409, "not_ready", "Your new CV isn't ready yet.")
    cv = improve["cv"]
    slug = re.sub(r"[^\w]+", "-", cv.get("name") or "cv").strip("-").lower() or "cv"
    return Response(
        content=build_docx(cv),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{slug}-cv.docx"'},
    )


@router.delete("/{job_id}")
async def delete_report(job_id: str) -> dict[str, bool]:
    _job(job_id)
    delete_job(job_id)
    return {"deleted": True}
