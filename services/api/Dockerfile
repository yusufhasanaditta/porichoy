FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv

WORKDIR /srv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app

RUN useradd --create-home --uid 10001 app
USER app

CMD ["sh", "-c", "/srv/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
