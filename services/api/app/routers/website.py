from typing import Any, Literal

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, Field

from app.errors import ApiError
from app.ingest.crawler import CrawlError, normalize_url
from app.pipelines.website import STEPS, run_website
from app.store.jobs import create_job, get_job

router = APIRouter(prefix="/v1/website", tags=["website"])


class AnalyzeRequest(BaseModel):
    url: str = Field(min_length=3, max_length=2048)
    lang: Literal["en", "bn"] = "en"


@router.post("/analyze", status_code=202)
async def analyze(body: AnalyzeRequest, tasks: BackgroundTasks) -> dict[str, str]:
    try:
        url = normalize_url(body.url)
    except CrawlError as exc:
        raise ApiError(422, exc.code, str(exc)) from exc
    job = create_job("website", STEPS, body.lang)
    tasks.add_task(run_website, job, url)
    return {"id": job.id, "status": job.status}


@router.get("/{job_id}")
async def get_report(job_id: str) -> dict[str, Any]:
    job = get_job(job_id, "website")
    if job is None:
        raise ApiError(404, "not_found", "This report doesn't exist or has expired. Please run a new check.")
    return job.model_dump()
