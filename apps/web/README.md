# apps/web

Porichoy web app: Next.js 16 (App Router) + TypeScript + Tailwind v4.

- Pages: `/` landing, `/scan/new` scan form, `/dashboard` report (sample data until the scan API lands).
- English/Bangla toggle (`messages/en.json`, `messages/bn.json`), light/dark theme, mobile bottom nav.
- Footer shows live API status from `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).

```bash
pnpm install          # from the repo root
pnpm -C apps/web dev  # http://localhost:3000
```
