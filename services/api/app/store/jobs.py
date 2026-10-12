"""In-memory job store for analyses.

Jobs live for JOB_TTL_SECONDS on one instance. Firestore replaces this in milestone 3;
until then a restart clears reports, and Cloud Run must run with max-instances 1.
"""

import time
import uuid
from typing import Any, Literal

from pydantic import BaseModel, Field

JOB_TTL_SECONDS = 6 * 60 * 60
MAX_JOBS = 500

JobStatus = Literal["running", "done", "error"]
StepStatus = Literal["pending", "running", "done", "skipped", "error"]


class Step(BaseModel):
    key: str
    status: StepStatus = "pending"
    ms: int | None = None
    note: str | None = None


class Job(BaseModel):
    id: str
    kind: Literal["website", "cv"]
    status: JobStatus = "running"
    lang: Literal["en", "bn"] = "en"
    steps: list[Step]
    result: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None
    created_at: float = Field(default_factory=time.time)
    # Private, server-only data (e.g. CV text). Never returned to clients.
    private: dict[str, Any] = Field(default_factory=dict, exclude=True)


_jobs: dict[str, Job] = {}


def _evict() -> None:
    now = time.time()
    for job_id in [k for k, j in _jobs.items() if now - j.created_at > JOB_TTL_SECONDS]:
        del _jobs[job_id]
    while len(_jobs) >= MAX_JOBS:
        oldest = min(_jobs.values(), key=lambda j: j.created_at)
        del _jobs[oldest.id]


def create_job(kind: Literal["website", "cv"], step_keys: list[str], lang: Literal["en", "bn"]) -> Job:
    _evict()
    job = Job(id=uuid.uuid4().hex[:16], kind=kind, lang=lang, steps=[Step(key=k) for k in step_keys])
    _jobs[job.id] = job
    return job


def get_job(job_id: str, kind: Literal["website", "cv"]) -> Job | None:
    job = _jobs.get(job_id)
    if job is None or job.kind != kind or time.time() - job.created_at > JOB_TTL_SECONDS:
        return None
    return job


class StepTimer:
    """Context manager that marks a job step running → done/error and records its duration."""

    def __init__(self, job: Job, key: str) -> None:
        self.step = next(s for s in job.steps if s.key == key)
        self.start = 0.0

    def __enter__(self) -> Step:
        self.step.status = "running"
        self.start = time.perf_counter()
        return self.step

    def __exit__(self, exc_type: type[BaseException] | None, *_: object) -> None:
        self.step.ms = int((time.perf_counter() - self.start) * 1000)
        if exc_type is not None:
            self.step.status = "error"
        elif self.step.status == "running":
            self.step.status = "done"


def delete_job(job_id: str) -> None:
    _jobs.pop(job_id, None)
