# Porichoy – Project Rules for AI Coding Agents

## Mission
Build "Porichoy", an agentic professional-presence assistant for the Google Cloud AI Builder Cup 2026
(theme: Future of Work & Enterprise Productivity). Working deployed prototype due 2026-10-18.
A working end-to-end demo beats extra features. Follow the milestone prompts in order.

## Fixed stack (do not change without asking)
- services/api: Python 3.12, FastAPI, google-adk 2.x, google-genai, firebase-admin, google-cloud-firestore,
  google-cloud-storage, httpx, selectolax, pypdf, pydantic v2, pytest. Package manager: uv.
- apps/web: Next.js App Router + TypeScript strict + Tailwind + shadcn/ui + Firebase JS SDK. Hosting: Firebase App Hosting.
- apps/extension: WXT + React + TS, Manifest V3. Permissions ONLY: sidePanel, activeTab, scripting, storage.
- packages/shared: JSON Schemas + generated TS types. services/api/app/models/schemas.py is the source of truth.
- Firestore + Cloud Storage + Firebase Auth; Cloud Run; region asia-southeast1.
- Models from env only: MODEL_MAIN=gemini-3.8-flash, MODEL_VERIFIER=gemini-3.1-pro-preview (fallback gemini-3.5-flash-lite),
  MODEL_LITE=gemini-3.5-flash-lite, MODEL_EMBED=gemini-embedding-001, MODEL_STT=gemini-3.5-transcribe.
  Never use gemini-2.x or gemini-3.6-flash.

## Coding standards
- Files <300 lines; fully typed (mypy-clean Python, TS strict, no `any`).
- Every LLM call uses structured output with a Pydantic/JSON schema; validate; on failure retry once with the error appended; then fail gracefully.
- Every finding has evidence {locator, quote}; run app/validate/evidence.py; drop findings whose quote is not in the source.
- Scores come only from app/scoring (deterministic). LLMs return check verdicts, not numbers.
- Agent prompts live in app/agents/prompts/*.md, never inline.
- All UI strings in apps/web/messages/{en,bn}.json. Bangla must be natural, not literal.
- Write each agent step to users/{uid}/scans/{scanId}/trace.

## Error handling
- API errors: {"error":{"code","message","retryable"}} with the correct HTTP status.
- Gemini calls: 60 s timeout, exponential backoff on 429/503 (max 3), log model, latency, tokens.
- UI: every async action has loading, empty, error and retry states.

## Security & privacy (non-negotiable)
- API keys only on the server via Secret Manager. Never in web/extension code or git.
- Verify the Firebase ID token on every route except /healthz and /v1/linkedin/oauth/callback.
- Never ask for, store or send LinkedIn passwords or cookies. Never fetch linkedin.com from the server.
- Extension reader runs only after an explicit click on the active tab; reads visible text only; never clicks,
  types, scrolls or changes the LinkedIn page; shows a preview before sending.
- LinkedIn posting only via the official API after an explicit "Publish" click.
- Rules: a user can only access users/{uid}/**. CV files auto-delete after 30 days. DELETE /v1/me removes everything.
- Crawler: same domain, max 10 pages, respect robots.txt, 10 s timeout, block private IPs (SSRF guard).

## Cost control
- Cache LLM results by (contentHash, rubricVersion, model). Max 3 verifier loops. Cloud Run max-instances 3.
- Google Search grounding only in planner and benchmark agents.

## Testing & Git
- pytest for scoring, evidence validator, schemas and routers (mock Gemini with fixtures).
- Before calling a milestone done: run tests + lint, start the app, show the acceptance check passing.
- Conventional commits after every milestone. Never commit .env or keys.
