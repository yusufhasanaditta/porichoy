# Porichoy (পরিচয়)

**An agentic professional-presence assistant for South Asian freelancers, job seekers and small businesses.**

Built for the **Google Cloud AI Builder Cup 2026**. Theme: **Future of Work & Enterprise Productivity**.

Porichoy checks a person's **CV, LinkedIn profile and website in one scan**. A team of Gemini agents (Google ADK):

- shows evidence for every problem it finds (the exact line or quote),
- flags places where the three sources contradict each other,
- rewrites weak sections in the user's own voice,
- has every rewrite checked by an **independent verifier running on a different model**,
- compares the profile with a target job post and builds a skill-gap plan.

It works in English and Bangla. The score comes from fixed rules in plain code, not from an LLM, so the same content always gets the same score.

> Status: **Website check and CV check work end to end** (real crawling, rule checks, Gemini review, verified CV rewrite, Word export).

## What works today

**Website check** (`/website`): crawls up to 6 pages (SSRF-guarded, robots.txt respected), runs 21 rule checks (technical, on-page, structured data, performance via Google PageSpeed) and 4 Gemini content checks. Each section has its own page. Gemini also writes a new title, meta description and JSON-LD.

**CV check** (`/cv`): reads the PDF line by line, runs 10 rule checks plus 4 Gemini checks and findings, each tied to the exact CV line. Gemini asks follow-up questions; your answers feed a writer model, and a second verifier model rejects any claim not in your CV or answers. Download the new CV as Word, save it as PDF, or copy it.

| Endpoint | What it does |
|---|---|
| `POST /v1/website/analyze` | Start a website check `{url, lang}` |
| `GET /v1/website/{id}` | Poll status and report |
| `POST /v1/cv/analyze` | Upload a CV PDF (multipart: `file`, `lang`, `target_role`) |
| `GET /v1/cv/{id}` | Poll status and report |
| `POST /v1/cv/{id}/improve` | Write the improved CV from `{answers, targetRole}` |
| `GET /v1/cv/{id}/improved.docx` | Download the new CV as Word |
| `DELETE /v1/cv/{id}` | Delete the CV and report |

Reports are kept in memory for 6 hours (Firestore comes with milestone 3).

## Architecture

```
Chrome Extension (WXT, MV3)            Web App (Next.js, Firebase App Hosting)
          \---- HTTPS + Firebase ID token ----/
                          v
      API: FastAPI + Google ADK on Cloud Run (asia-southeast1)
         |                 |                 |
   Gemini API         Firestore         Cloud Storage
```

| Path | What it is |
|---|---|
| `services/api` | Python 3.12, FastAPI, Google ADK agents, scoring, ingestion |
| `apps/web` | Next.js 16 + TypeScript + Tailwind v4: landing, scan form, dashboard (EN/BN, light/dark, mobile-first) |
| `apps/extension` | WXT Manifest V3 side panel (milestone 9) |
| `packages/shared` | JSON Schemas and TypeScript types generated from the API's Pydantic models |
| `docs` | Architecture, scoring, compliance, demo script |

## Local setup

Requirements: [uv](https://docs.astral.sh/uv/), Node 20+, pnpm.

```bash
cd services/api
cp .env.example .env          # add GEMINI_API_KEY (and optional PSI_API_KEY); never commit .env
uv sync                        # installs Python 3.12 + dependencies
uv run pytest
uv run uvicorn app.main:app --reload --port 8080
# open http://localhost:8080/healthz
```

In a second terminal, run the web app:

```bash
pnpm install
pnpm -C apps/web dev
# open http://localhost:3000  (footer shows "API online" when the API is running)
```

## LinkedIn compliance

Porichoy never scrapes LinkedIn or automates actions on it. Users upload their own LinkedIn "Save to PDF" export or paste their own text. Approved edits come with **Copy** buttons. Posts go out only through the official Share on LinkedIn API, and only after the user clicks Publish. Details: [docs/compliance.md](docs/compliance.md).

## Roadmap

1. [x] Scaffold monorepo, `/healthz`
   - [x] UI preview: landing, scan form, dashboard (sample data)
2. [ ] Firebase Auth + deploy (Cloud Run, App Hosting)
3. [ ] Schemas + Firestore rules
4. [ ] Ingestion + rule-based scoring
5. [ ] Auditor agents (ADK `ParallelAgent`) + evidence checker
6. [ ] Dashboard UI with live agent trace
7. [ ] Rewriter ⇄ Verifier loop (ADK `LoopAgent`)
8. [ ] SEO fix-it
9. [ ] Chrome extension
10. [ ] Consistency + skill-gap agents
11. [ ] Planner, LinkedIn share, Bangla voice
12. [ ] Polish + submission

## License

MIT
