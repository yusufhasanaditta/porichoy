"""Uniform API error shape: {"error": {"code", "message", "retryable"}}."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, retryable: bool = False) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.retryable = retryable


def _body(code: str, message: str, retryable: bool) -> dict[str, dict[str, str | bool]]:
    return {"error": {"code": code, "message": message, "retryable": retryable}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(_body(exc.code, exc.message, exc.retryable), status_code=exc.status)

    @app.exception_handler(HTTPException)
    async def _http_error(_: Request, exc: HTTPException) -> JSONResponse:
        retryable = exc.status_code in (429, 503)
        return JSONResponse(_body(f"http_{exc.status_code}", str(exc.detail), retryable), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(_body("invalid_request", str(exc.errors()), False), status_code=422)
